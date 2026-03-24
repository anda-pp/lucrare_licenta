const fs = require('fs');
const filepath = 'c:\\Users\\Anda\\Desktop\\lucrare_licenta\\frontend\\src\\components\\AdminLayout.jsx';
let content = fs.readFileSync(filepath, 'utf8');

// Replace role checks
content = content.replace(/!== \x27Admin\x27/g, "!== 'Superadmin'");

// Replace paths inside Link to=
content = content.replace(/to="\x2Fadmin/g, 'to="/superadmin');

// Replace isActive paths
content = content.replace(/isActive\(\x27\x2Fadmin/g, "isActive('/superadmin");

// Replace Header Text
content = content.replace(/<h2>Admin Panel<\/h2>/g, '<h2>Superadmin Dashboard</h2>');

fs.writeFileSync(filepath, content);
console.log('AdminLayout replaced successfully');
