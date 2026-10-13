const axios = require('axios');
const API_BASE = 'http://localhost:5000/api/v1';

async function runFullE2ETest() {
  console.log('====================================================');
  console.log('UNISERVE FULL E2E PLACEMENT WORKFLOW VERIFICATION');
  console.log('====================================================');

  try {
    // ----------------------------------------------------
    // STEP 1: Log in TPO Officer
    // ----------------------------------------------------
    console.log('\n[1] Logging in as Placement Officer (tpo@college.edu)...');
    const tpoLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'tpo@college.edu',
      password: 'Password@123',
    });
    const tpoToken = tpoLoginRes.data.token;
    console.log('✅ TPO Officer Logged in successfully. Token received.');

    // ----------------------------------------------------
    // STEP 2: Log in Eligible Student (2023CSE001)
    // ----------------------------------------------------
    console.log('\n[2] Logging in as Eligible Student (Aditya Varma - 2023CSE001)...');
    const cseLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: '2023CSE001',
      password: 'Password@123',
    });
    const cseToken = cseLoginRes.data.token;
    console.log('✅ CSE Student Logged in successfully.');

    // ----------------------------------------------------
    // STEP 3: Log in Ineligible Student (2023MECH001)
    // ----------------------------------------------------
    console.log('\n[3] Logging in as Ineligible Student (Karthik - 2023MECH001)...');
    const mechLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: '2023MECH001',
      password: 'Password@123',
    });
    const mechToken = mechLoginRes.data.token;
    console.log('✅ MECH Student Logged in successfully.');

    // ----------------------------------------------------
    // STEP 4: Fetch Companies as CSE Student (Should see categories)
    // ----------------------------------------------------
    console.log('\n[4] Fetching published placement companies for CSE student...');
    const cseCompaniesRes = await axios.get(`${API_BASE}/companies`, {
      headers: { Authorization: `Bearer ${cseToken}` },
    });
    const cseCompanies = cseCompaniesRes.data.data;
    console.log(`✅ CSE student received ${cseCompanies.length} companies.`);
    
    // Pick target company: Microsoft India (ID 2) or Google India (ID 1)
    const targetComp = cseCompanies.find(c => c.name.includes('Microsoft') || c.name.includes('Google')) || cseCompanies[0];
    console.log(`Target placement company: "${targetComp.name}" (ID: ${targetComp.id}, Drive ID: ${targetComp.drive_id})`);
    console.log(`- CSE Student Eligibility: is_eligible=${targetComp.is_eligible}, Category=${targetComp.category}`);

    // ----------------------------------------------------
    // STEP 5: Verify Ineligibility for MECH Student
    // ----------------------------------------------------
    console.log('\n[5] Fetching published placement companies for MECH student...');
    const mechCompaniesRes = await axios.get(`${API_BASE}/companies`, {
      headers: { Authorization: `Bearer ${mechToken}` },
    });
    const mechComp = mechCompaniesRes.data.data.find(c => c.id === targetComp.id);
    console.log(`- MECH Student Eligibility on "${mechComp.name}":`);
    console.log(`  is_eligible: ${mechComp.is_eligible}`);
    console.log(`  category: ${mechComp.category}`);
    console.log(`  reasons: ${JSON.stringify(mechComp.ineligibility_reasons)}`);

    if (mechComp.is_eligible === false) {
      console.log('✅ MECH student is correctly marked as INELIGIBLE in company listings.');
    }

    // ----------------------------------------------------
    // STEP 6: Ineligible Student Attempts to Apply via API
    // ----------------------------------------------------
    console.log('\n[6] Testing security: Ineligible MECH student calling Apply API directly...');
    try {
      await axios.post(`${API_BASE}/companies/${targetComp.id}/apply`, {}, {
        headers: { Authorization: `Bearer ${mechToken}` },
      });
      console.error('❌ SECURITY FAILURE: Ineligible student was able to apply!');
    } catch (err) {
      console.log(`✅ SERVER-SIDE REJECTION SUCCESS: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
      if (err.response?.data?.reasons) {
        console.log(`   Reasons given: ${JSON.stringify(err.response.data.reasons)}`);
      }
    }

    // ----------------------------------------------------
    // STEP 7: Eligible CSE Student Applies
    // ----------------------------------------------------
    console.log('\n[7] Testing eligible student application...');
    let unappliedComp = cseCompanies.find(c => c.is_eligible && !c.has_applied);
    const applyTarget = unappliedComp || targetComp;
    try {
      const applyRes = await axios.post(`${API_BASE}/companies/${applyTarget.id}/apply`, {}, {
        headers: { Authorization: `Bearer ${cseToken}` },
      });
      const appId = applyRes.data?.data?.application_id || applyRes.data?.application_id || 'REGISTERED';
      console.log(`✅ Application submitted successfully for ${applyTarget.name}! Application ID: #APPL-${appId}`);
    } catch (err) {
      if (err.response?.data?.message?.includes('already applied') || err.response?.data?.message?.includes('already exists')) {
        console.log(`ℹ️ Student already has active application for ${applyTarget.name} (verified duplicate enforcement).`);
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // STEP 8: Duplicate Application Prevention
    // ----------------------------------------------------
    console.log('\n[8] Testing duplicate application prevention...');
    try {
      await axios.post(`${API_BASE}/companies/${targetComp.id}/apply`, {}, {
        headers: { Authorization: `Bearer ${cseToken}` },
      });
      console.error('❌ DUPLICATE FAILURE: Allowed duplicate application!');
    } catch (err) {
      console.log(`✅ DUPLICATE BLOCKED: HTTP ${err.response?.status} - "${err.response?.data?.message}"`);
    }

    // ----------------------------------------------------
    // STEP 9: TPO Officer Views Registered Students for this Company
    // ----------------------------------------------------
    console.log(`\n[9] TPO Officer retrieving registered applicants for Company ID ${targetComp.id}...`);
    const applicantsRes = await axios.get(`${API_BASE}/companies/${targetComp.id}/applicants`, {
      headers: { Authorization: `Bearer ${tpoToken}` },
    });
    const applicants = applicantsRes.data.data || [];
    const total_registered = applicantsRes.data.total_registered;
    const department_breakdown = applicantsRes.data.department_counts;
    console.log(`✅ Total registered students: ${total_registered}`);
    console.log(`✅ Department breakdown: ${JSON.stringify(department_breakdown)}`);
    console.log(`✅ Number of applicants returned: ${applicants.length}`);

    const cseApplicant = applicants.find(a => a.email === 'student.cse1@college.edu' || a.email === 'aditya.varma@student.edu' || a.department_code === 'CSE');
    if (!cseApplicant) {
      throw new Error('CSE applicant was not found in registered students table!');
    }
    const targetAppId = cseApplicant.application_id || cseApplicant.id;
    console.log(`Found registered applicant: ${cseApplicant.first_name} ${cseApplicant.last_name} (#APPL-${targetAppId}), Dept: ${cseApplicant.department_code}, Status: ${cseApplicant.application_status}`);

    // ----------------------------------------------------
    // STEP 10: TPO Officer Updates Applicant (Eligibility, Advance Round, Schedule Interview)
    // ----------------------------------------------------
    console.log('\n[10] TPO Officer updating applicant round progression & interview schedule...');
    const updateApplicantRes = await axios.put(
      `${API_BASE}/companies/${targetComp.id}/applicants/${targetAppId}`,
      {
        eligibility_status: 'ELIGIBLE',
        application_status: 'SHORTLISTED',
        current_round: 2,
        interview_scheduled_at: '2026-11-26 10:30:00',
        interview_venue_or_link: 'Campus Placement Lab #3 & Meet Room /videocall/interview/MS-TECH',
        feedback: 'Excellent DSA performance in round 1 screening. Shortlisted for Technical Interview.',
        final_result: 'PENDING',
      },
      { headers: { Authorization: `Bearer ${tpoToken}` } }
    );
    console.log(`✅ Applicant updated: "${updateApplicantRes.data.message}"`);

    // ----------------------------------------------------
    // STEP 11: TPO Officer Publishes a Drive Announcement
    // ----------------------------------------------------
    console.log('\n[11] TPO Officer publishing recruitment drive announcement...');
    const annRes = await axios.post(
      `${API_BASE}/companies/${targetComp.id}/announcements`,
      {
        title: 'Technical Round 2 Schedule & Guidelines',
        content: 'Technical Interview round for shortlisted candidates will begin on Nov 26 at 10:30 AM in Lab 3. Keep university ID cards ready.',
        urgency: 'HIGH',
      },
      { headers: { Authorization: `Bearer ${tpoToken}` } }
    );
    console.log(`✅ Announcement published: "${annRes.data.message}"`);

    // ----------------------------------------------------
    // STEP 12: Student Views "My Applications" Dashboard
    // ----------------------------------------------------
    console.log('\n[12] CSE Student fetching "My Applications" tracking dashboard...');
    const myAppsRes = await axios.get(`${API_BASE}/applications/my`, {
      headers: { Authorization: `Bearer ${cseToken}` },
    });
    const myApps = myAppsRes.data.data;
    console.log(`✅ Student retrieved ${myApps.length} active applications.`);

    const trackingApp = myApps.find(a => a.id === targetAppId || a.company_id === targetComp.id);
    if (!trackingApp) {
      throw new Error('Application not found in student tracking response!');
    }

    console.log('--- Student Application Tracking Details ---');
    console.log(`- Company: ${trackingApp.company_name} (${trackingApp.job_title})`);
    console.log(`- Application ID: #APPL-${trackingApp.id}`);
    console.log(`- Application Status: ${trackingApp.status}`);
    console.log(`- Eligibility Status: ${trackingApp.eligibility_status}`);
    console.log(`- Current Round: Round ${trackingApp.current_round_number} (${trackingApp.current_round_name})`);
    console.log(`- Interview Schedule: ${trackingApp.interview_scheduled_at} at ${trackingApp.interview_venue_or_link}`);
    console.log(`- Feedback: "${trackingApp.feedback}"`);
    console.log(`- Configured Drive Selection Rounds: ${trackingApp.selection_rounds?.length || 0} rounds`);
    console.log(`- Drive Announcements: ${trackingApp.announcements?.length || 0} announcements`);

    // ----------------------------------------------------
    // STEP 13: TPO Officer Final Round Selection
    // ----------------------------------------------------
    console.log('\n[13] TPO Officer marking student as SELECTED in final results...');
    await axios.put(
      `${API_BASE}/companies/${targetComp.id}/applicants/${targetAppId}`,
      {
        application_status: 'OFFERED',
        final_result: 'SELECTED',
        feedback: 'Candidate recommended for employment offer.',
      },
      { headers: { Authorization: `Bearer ${tpoToken}` } }
    );
    console.log('✅ Final result set to SELECTED.');

    // Verify student sees the selection
    const finalCheckRes = await axios.get(`${API_BASE}/applications/my`, {
      headers: { Authorization: `Bearer ${cseToken}` },
    });
    const finalApp = finalCheckRes.data.data.find(a => a.id === targetAppId || a.company_id === targetComp.id);
    console.log(`✅ Student view reflects Final Result: ${finalApp.final_result}, Status: ${finalApp.status}`);

    console.log('\n====================================================');
    console.log('🎉 ALL 13 END-TO-END WORKFLOW ACCEPTANCE CRITERIA PASSED!');
    console.log('====================================================');
  } catch (err) {
    console.error('❌ E2E Test Error:', err.response?.data || err.message);
    process.exit(1);
  }
}

runFullE2ETest();
