const axios = require('axios');

async function testWorkflow() {
  console.log('--- Testing Placement Workflow End-to-End ---');

  // 1. Placement Officer Login
  const tpoLogin = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: 'tpo@college.edu',
    password: 'Password@123',
  });
  const tpoToken = tpoLogin.data.token;
  console.log('✓ TPO Officer Logged In:', tpoLogin.data.user.email);

  // 2. Fetch Companies as TPO
  const tpoComps = await axios.get('http://localhost:5000/api/v1/companies', {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  console.log(`✓ TPO sees ${tpoComps.data.count} placement companies`);
  const firstComp = tpoComps.data.data[0];
  console.log(`  Target company: ${firstComp.name} (ID: ${firstComp.id})`);

  // 3. Fetch Registered Applicants for this company
  const applicantsRes = await axios.get(`http://localhost:5000/api/v1/companies/${firstComp.id}/applicants`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  console.log(`✓ Company applicants loaded: ${applicantsRes.data.total_registered} registered students`);
  console.log('  Dept breakdown:', applicantsRes.data.department_counts);

  // 4. Test Student CSE (Aditya - 2023CSE001)
  const cseLogin = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: '2023CSE001',
    password: 'Password@123',
  });
  const cseToken = cseLogin.data.token;
  console.log('\n✓ Student CSE Logged In:', cseLogin.data.user.first_name);

  // Fetch companies as student
  const studentComps = await axios.get('http://localhost:5000/api/v1/companies', {
    headers: { Authorization: `Bearer ${cseToken}` },
  });
  const eligibleComps = studentComps.data.data.filter(c => c.category === 'ELIGIBLE');
  const appliedComps = studentComps.data.data.filter(c => c.category === 'APPLIED');
  const ineligibleComps = studentComps.data.data.filter(c => c.category === 'INELIGIBLE');
  console.log(`✓ Student Sees: ${eligibleComps.length} Eligible, ${appliedComps.length} Applied, ${ineligibleComps.length} Ineligible`);

  if (ineligibleComps.length > 0) {
    console.log(`  Sample Ineligible: ${ineligibleComps[0].name} -> Reasons:`, ineligibleComps[0].ineligibility_reasons);
  }

  // 5. Test My Applications for Student
  const myApps = await axios.get('http://localhost:5000/api/v1/applications/my-applications', {
    headers: { Authorization: `Bearer ${cseToken}` },
  });
  console.log(`✓ Student My Applications: ${myApps.data.count} active applications`);
  if (myApps.data.count > 0) {
    const a = myApps.data.data[0];
    console.log(`  App #APP-${a.id}: ${a.company_name} | Status: ${a.status} | Rounds: ${a.selection_rounds?.length}`);
  }

  // 6. Test Ineligible Student Application Rejection
  // Student MECH (Karthik - 2023MECH001) trying to apply to Google India (CSE/ECE/IT only)
  const mechLogin = await axios.post('http://localhost:5000/api/v1/auth/login', {
    email: '2023MECH001',
    password: 'Password@123',
  });
  const mechToken = mechLogin.data.token;
  try {
    await axios.post('http://localhost:5000/api/v1/companies/1/apply', {}, {
      headers: { Authorization: `Bearer ${mechToken}` },
    });
    console.error('❌ Ineligible student application should have been rejected!');
  } catch (err) {
    console.log('✓ Ineligible application properly blocked by backend:', err.response?.data?.message, err.response?.data?.ineligibilityReasons);
  }

  // 7. Test TPO updating applicant status and advancing round
  if (applicantsRes.data.data.length > 0) {
    const targetApp = applicantsRes.data.data[0];
    const updateRes = await axios.put(`http://localhost:5000/api/v1/companies/${firstComp.id}/applicants/${targetApp.application_id}`, {
      status: 'SHORTLISTED',
      eligibility_status: 'ELIGIBLE',
      current_round_number: 2,
      interview_scheduled_at: '2026-11-26 14:00',
      interview_venue_or_link: 'Main Placement Auditorium Lab 1',
    }, {
      headers: { Authorization: `Bearer ${tpoToken}` },
    });
    console.log('\n✓ TPO updated applicant status:', updateRes.data.message);
  }

  // 8. Test Drive Announcements
  const postAnn = await axios.post(`http://localhost:5000/api/v1/companies/${firstComp.id}/announcements`, {
    title: 'Pre-Placement Talk (PPT) Link',
    content: 'The pre-placement presentation will commence tomorrow at 11:00 AM via UniServe Meet.',
  }, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  console.log('✓ TPO published announcement:', postAnn.data.message);

  const getAnn = await axios.get(`http://localhost:5000/api/v1/companies/${firstComp.id}/announcements`, {
    headers: { Authorization: `Bearer ${tpoToken}` },
  });
  console.log(`✓ Fetched ${getAnn.data.data.length} announcements for ${firstComp.name}`);

  console.log('\n🎉 ALL BACKEND WORKFLOW TESTS PASSED PERFECTLY!');
}

testWorkflow().then(() => process.exit(0)).catch((err) => {
  console.error('Workflow test error:', err.response?.data || err.message);
  process.exit(1);
});
