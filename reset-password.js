const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const NEW_PASSWORD = 'Admin@123';
const adminFile = path.join(__dirname, 'backend', 'data', 'admin.json');

bcrypt.hash(NEW_PASSWORD, 10).then(hash => {
  const admin = JSON.parse(fs.readFileSync(adminFile, 'utf8'));
  admin.passwordHash = hash;
  fs.writeFileSync(adminFile, JSON.stringify(admin, null, 2), 'utf8');
  console.log('✅ Đặt lại mật khẩu thành công!');
  console.log('   Username:', admin.username);
  console.log('   Password:', NEW_PASSWORD);
});
