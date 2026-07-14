"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Trash2 } from "lucide-react";

interface InventoryItem {
  _id: string;
  itemName: string;
  itemCode: string;
  unit: string;
  currentStock: number;
}

interface RequestItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiEndpoint: string;
}

export default function RequestItemModal({ isOpen, onClose, onSuccess, apiEndpoint }: RequestItemModalProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(false);
  const [error, setError] = useState("");

  const [selectedItems, setSelectedItems] = useState<{ itemId: string; quantity: number }[]>([]);
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      setSelectedItems([]);
      setPurpose("");
      setError("");
    }
  }, [isOpen]);

  const fetchItems = async () => {
    setFetchingItems(true);
    try {
      const res = await fetch(`${apiEndpoint}/items`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
      }
    } catch (err) {
      console.error("Failed to fetch items", err);
    } finally {
      setFetchingItems(false);
    }
  };

  const handleAddItem = (itemId: string) => {
    if (!itemId) return;
    if (selectedItems.find((i) => i.itemId === itemId)) return;
    setSelectedItems([...selectedItems, { itemId, quantity: 1 }]);
  };

  const handleUpdateQuantity = (itemId: string, qty: number) => {
    const item = items.find((i) => i._id === itemId);
    if (!item) return;

    if (qty > item.currentStock) {
      setError(`Cannot request more than available stock (${item.currentStock}) for ${item.itemName}`);
      return;
    }
    if (qty < 1) return;

    setError("");
    setSelectedItems(selectedItems.map((i) => (i.itemId === itemId ? { ...i, quantity: qty } : i)));
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter((i) => i.itemId !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setError("Please add at least one item.");
      return;
    }
    if (!purpose.trim()) {
      setError("Please specify the purpose of the request.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${apiEndpoint}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems, purpose }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to create request");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">New Inventory Request</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

          <form id="requestForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add Item</label>
              <select
                className="w-full border border-gray-300 rounded p-2"
                onChange={(e) => {
                  handleAddItem(e.target.value);
                  e.target.value = ""; // reset
                }}
                disabled={fetchingItems}
                defaultValue=""
              >
                <option value="" disabled>
                  {fetchingItems ? "Loading items..." : "Select an item to request..."}
                </option>
                {items.map((item) => {
                  const alreadyAdded = selectedItems.some((i) => i.itemId === item._id);
                  return (
                    <option key={item._id} value={item._id} disabled={alreadyAdded}>
                      {item.itemName} ({item.itemCode}) - {item.currentStock} {item.unit} available
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedItems.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 font-medium">Item</th>
                      <th className="p-2 font-medium w-32">Quantity</th>
                      <th className="p-2 font-medium w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((selected) => {
                      const itemDetails = items.find((i) => i._id === selected.itemId);
                      return (
                        <tr key={selected.itemId} className="border-t">
                          <td className="p-2">
                            <div>{itemDetails?.itemName}</div>
                            <div className="text-xs text-gray-500">{itemDetails?.itemCode}</div>
                          </td>
                          <td className="p-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(selected.itemId, selected.quantity - 1)}
                              className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center">{selected.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(selected.itemId, selected.quantity + 1)}
                              className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </td>
                          <td className="p-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(selected.itemId)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Request *</label>
              <textarea
                className="w-full border border-gray-300 rounded p-2"
                rows={3}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Why do you need these items?"
                required
              ></textarea>
            </div>
          </form>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="requestForm"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || selectedItems.length === 0}
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
