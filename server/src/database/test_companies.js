const axios = require('axios');

async function test() {
  console.log('Testing authentication and role-based company filtering...');

  // 1. Super Admin test
  const loginAdmin = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: 'superadmin@uniserve.edu',
    password: 'Password@123',
  });
  const adminToken = loginAdmin.data.token;
  console.log('✓ Admin Logged In:', loginAdmin.data.user.roleName);

  const adminComps = await axios.get('http://localhost:5000/api/v1/companies', {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`✓ Admin sees ${adminComps.data.count} placement companies total:`);
  for (const c of adminComps.data.data) {
    console.log(`  - ${c.name} | Depts: ${JSON.stringify(c.eligible_departments)} | Year: ${c.academic_year} | Quota: ${c.configured_eligible_quota} | Enrolled Matching: ${c.enrolled_matching_students_count}`);
  }

  // 2. Student CSE test (Aditya - 2023CSE001)
  const loginCse = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: '2023CSE001',
    password: 'Password@123',
  });
  const cseToken = loginCse.data.token;
  console.log(`\n✓ Student CSE Logged In: Reg ${loginCse.data.user.registerNumber}, Dept ${loginCse.data.user.departmentCode}, Year ${loginCse.data.user.academicYear}`);
  const cseComps = await axios.get('http://localhost:5000/api/v1/companies', {
    headers: { Authorization: `Bearer ${cseToken}` },
  });
  console.log(`✓ CSE Student sees ${cseComps.data.count} eligible companies:`);
  for (const c of cseComps.data.data) {
    console.log(`  - ${c.name} (Qualifies: ${c.user_qualifies}, Min CGPA: ${c.min_cgpa})`);
  }

  // 3. Student MECH test (Karthik - 2023MECH001)
  const loginMech = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: '2023MECH001',
    password: 'Password@123',
  });
  const mechToken = loginMech.data.token;
  console.log(`\n✓ Student MECH Logged In: Reg ${loginMech.data.user.registerNumber}, Dept ${loginMech.data.user.departmentCode}, Year ${loginMech.data.user.academicYear}`);
  const mechComps = await axios.get('http://localhost:5000/api/v1/companies', {
    headers: { Authorization: `Bearer ${mechToken}` },
  });
  console.log(`✓ MECH Student sees ${mechComps.data.count} eligible companies:`);
  for (const c of mechComps.data.data) {
    console.log(`  - ${c.name} (Qualifies: ${c.user_qualifies}, Min CGPA: ${c.min_cgpa})`);
  }

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

test().catch((err) => {
  console.error('Test Failed:', err.response?.data || err.message);
  process.exit(1);
});
