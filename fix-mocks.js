const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'features', 'user-management', 'UserManagement.test.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences
content = content.replace(/mockFilterUsersV2/g, '(UserService.filterUsersV2 as jest.Mock)');
content = content.replace(/mockfilterUsersV2/g, '(UserService.filterUsersV2 as jest.Mock)');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed all mock references');
