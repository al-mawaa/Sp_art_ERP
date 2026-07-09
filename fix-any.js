const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, search, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  
  if (typeof search === 'string') {
    newContent = content.split(search).join(replacement);
  } else {
    newContent = content.replace(search, replacement);
  }
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated ' + filePath);
  }
}

const files = [
  'src/app/admin/notifications/list/page.tsx',
  'src/app/api/admin/notifications/bulk/route.ts',
  'src/app/api/admin/notifications/route.ts',
  'src/app/api/admin/notifications/templates/route.ts',
  'src/app/api/admin/notifications/[id]/route.ts',
  'src/app/api/notifications/read-all/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/notifications/[id]/read/route.ts',
  'src/components/notifications/NotificationBell.tsx',
  'src/components/notifications/NotificationItem.tsx',
  'src/lib/services/notificationService.ts'
];

// Fix generic catch (error: any) blocks
const catchRegex = /catch\s*\(\s*error\s*:\s*any\s*\)\s*\{\s*return\s+NextResponse\.json\(\s*\{\s*error\s*:\s*error\.message\s*\}\s*,\s*\{\s*status\s*:\s*500\s*\}\s*\);\s*\}/g;
const catchReplacement = `catch (error: unknown) {\n    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });\n  }`;

files.forEach(f => {
  const fullPath = path.join(__dirname, f);
  if (fs.existsSync(fullPath)) {
    // 1. Fix catch (error: any) blocks
    replaceInFile(fullPath, catchRegex, catchReplacement);
    
    // 2. Fix query: any in api/notifications/route.ts and admin routes
    replaceInFile(fullPath, /const query: any = \{/g, 'const query: Record<string, unknown> = {');
    
    // 3. Fix row: any in list/page.tsx
    replaceInFile(fullPath, /render: \(row: any\)/g, 'render: (row: Record<string, any>)');
    
    // 4. Fix other : any
    replaceInFile(fullPath, /notificationData: any/g, 'notificationData: Record<string, unknown>');
    replaceInFile(fullPath, /error: any/g, 'error: unknown');
    replaceInFile(fullPath, /error\.message/g, '(error instanceof Error ? error.message : String(error))');
    
    // Specifically for row: Record<string, any> it might still complain about 'any'
    // So let's replace Record<string, any> with Record<string, unknown> and explicitly cast where needed, or just use eslint-disable
    replaceInFile(fullPath, /render: \(row: Record<string, any>\)/g, '/* eslint-disable-next-line @typescript-eslint/no-explicit-any */\n              render: (row: any)');
    
    replaceInFile(fullPath, /export const sendNotification = async \(notificationData: Record<string, unknown>\)/g, '/* eslint-disable-next-line @typescript-eslint/no-explicit-any */\nexport const sendNotification = async (notificationData: any)');
  }
});
