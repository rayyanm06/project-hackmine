const fs = require('fs');
const routes = ['index', 'complaints', 'tasks', 'staff', 'verification', 'recommendations', 'rooms-360', 'pricing', 'insights', 'audit', 'settings'];

routes.forEach(r => {
  const componentName = r.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('') + 'Page';
  const path = r === 'index' ? '/' : '/' + r;
  const fileName = r === 'index' ? '_layout.index.tsx' : '_layout.' + r + '.tsx';
  
  const content = `import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_layout${path}')({
  component: ${componentName},
})

function ${componentName}() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">${componentName.replace('Page', '')}</h1>
      <p className="text-muted-foreground">This is a placeholder page.</p>
    </div>
  )
}
`;
  fs.writeFileSync('src/routes/' + fileName, content);
  console.log('Created ' + fileName);
});
