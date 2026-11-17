let internDatabase = [];

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const skillInput = document.getElementById('skill-input');
const locationInput = document.getElementById('location-input');
const categoryInput = document.getElementById('category-input');
const skillTags = document.querySelectorAll('.skill-tag');
const aboutSection = document.getElementById('about-section');
const resultsSection = document.getElementById('results-section');
const internshipsGrid = document.getElementById('internships-grid');
const loader = document.getElementById('loader');
const noResults = document.getElementById('no-results');
const resultsTitle = document.getElementById('results-title');
const sortSelect = document.getElementById('sort-select');

// View Elements
const navDiscover = document.getElementById('nav-discover');
const navProfile = document.getElementById('nav-profile');
const discoverView = document.getElementById('discover-view');
const profileView = document.getElementById('profile-view');
const profileEmail = document.getElementById('profile-email');
const profileName = document.getElementById('profile-name');
const attrName = document.getElementById('attr-name');
const attrEmail = document.getElementById('attr-email');
const profileSkillCount = document.getElementById('profile-skill-count');
const profileMatchCount = document.getElementById('profile-match-count');
const profileCategoryCount = document.getElementById('profile-category-count');
const profileSkillLabel = document.getElementById('profile-skill-label');
const profileMatchSummary = document.getElementById('profile-match-summary');
const profileRecommendations = document.getElementById('profile-recommendations');
const profileSkillsContainer = document.getElementById('profile-skills');

// Auth DOM Elements
const signinModal = document.getElementById('signin-modal');
const closeSignin = document.getElementById('close-signin');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const otpVerificationForm = document.getElementById('otp-verification-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const showSignupBtn = document.getElementById('show-signup');
const showSigninBtn = document.getElementById('show-signin');
const showForgotPasswordBtn = document.getElementById('show-forgot-password');
const showSigninFromForgotBtn = document.getElementById('show-signin-from-forgot');
const backToPreviousBtn = document.getElementById('back-to-previous');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const loginBtn = document.querySelector('.login-btn');

// Signup Specific Elements
const signupPassword = document.getElementById('signup-password');
const signupConfirm = document.getElementById('signup-confirm');
const passwordError = document.getElementById('password-error');

// Current State
let currentResults = [];
let querySkills = [];
let isLoggedIn = false;
let currentUser = null;
let currentOtpContext = '';
let tempSignupData = {};
let tempResetEmail = '';

// On load, check for saved session
document.addEventListener('DOMContentLoaded', () => {
    loadInternships().catch(error => {
        console.error('Unable to preload internships:', error);
    });

    const savedUser = localStorage.getItem('interner_user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            // Re-populate and log in
            handleSuccessfulAuth(user);
        } catch (e) { }
    }
});

// Navigation Logic
navProfile.addEventListener('click', (e) => {
    e.preventDefault();
    if (requireAuth()) return;

    discoverView.style.display = 'none';
    profileView.style.display = 'block';
    navDiscover.classList.remove('active');
    navProfile.classList.add('active');
});

navDiscover.addEventListener('click', (e) => {
    e.preventDefault();

    discoverView.style.display = 'block';
    profileView.style.display = 'none';
    resultsSection.style.display = 'none';
    aboutSection.style.display = 'block';
    navDiscover.classList.add('active');
    navProfile.classList.remove('active');
    aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// Event Listeners
searchBtn.addEventListener('click', handleSearch);
skillInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});
skillInput.addEventListener('focus', () => requireAuth());

skillTags.forEach(tag => {
    tag.addEventListener('click', () => {
        if (!isLoggedIn) {
            requireAuth();
            return;
        }

        const skill = tag.dataset.skill;
        // Append skill if input has content, or set it directly
        if (skillInput.value) {
            if (!skillInput.value.toLowerCase().includes(skill.toLowerCase())) {
                skillInput.value = skillInput.value + ', ' + skill;
            }
        } else {
            skillInput.value = skill;
        }

        // Add visual feedback
        tag.style.transform = 'scale(0.9)';
        setTimeout(() => tag.style.transform = 'scale(1)', 150);

        // Auto search
        handleSearch();
    });
});

sortSelect.addEventListener('change', () => {
    renderInternships(currentResults);
});

// Auth Listeners
loginBtn.addEventListener('click', () => {
    signinModal.style.display = 'flex';
    showSigninForm();
});

closeSignin.addEventListener('click', () => {
    signinModal.style.display = 'none';
});

// Close modal if clicking outside content
signinModal.addEventListener('click', (e) => {
    if (e.target === signinModal) {
        signinModal.style.display = 'none';
    }
});

// Toggle Forms
showSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showSignupForm();
});

showSigninBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showSigninForm();
});

showForgotPasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showForgotPasswordForm();
});

showSigninFromForgotBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showSigninForm();
});

backToPreviousBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showForgotPasswordForm();
});

function hideAllForms() {
    signinForm.style.display = 'none';
    signupForm.style.display = 'none';
    forgotPasswordForm.style.display = 'none';
    otpVerificationForm.style.display = 'none';
    resetPasswordForm.style.display = 'none';
}

function showSigninForm() {
    hideAllForms();
    signinForm.style.display = 'block';
    authTitle.textContent = 'Welcome Back';
    authSubtitle.textContent = 'Sign in to unlock personalized internship recommendations.';
}

function showSignupForm() {
    hideAllForms();
    signupForm.style.display = 'block';
    authTitle.textContent = 'Create an Account';
    authSubtitle.textContent = 'Join Interner to discover matching internships based on your skills.';
}

function showForgotPasswordForm() {
    hideAllForms();
    forgotPasswordForm.style.display = 'block';
    authTitle.textContent = 'Forgot Password';
    authSubtitle.textContent = 'Enter your email to receive a 6-digit OTP to reset your password.';
}

function showOtpVerificationForm(context) {
    currentOtpContext = context;
    hideAllForms();
    otpVerificationForm.style.display = 'block';
    authTitle.textContent = 'Verify OTP';
    authSubtitle.textContent = 'Please enter the 6-digit OTP sent to your email (check terminal).';
}

function showResetPasswordForm() {
    hideAllForms();
    resetPasswordForm.style.display = 'block';
    authTitle.textContent = 'Reset Password';
    authSubtitle.textContent = 'Enter your new password.';
}

signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = signinEmail.value;
    const password = document.getElementById('signin-password').value;
    const submitBtn = signinForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Signing In...';

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            handleSuccessfulAuth(data.user);
        } else {
            alert(data.error || 'Invalid credentials');
            submitBtn.textContent = originalBtnText;
        }
    } catch (err) {
        console.error(err);
        alert('Could not connect to server.');
        submitBtn.textContent = originalBtnText;
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (signupPassword.value !== signupConfirm.value) {
        passwordError.style.display = 'block';
        return;
    }
    passwordError.style.display = 'none';

    const firstName = signupFname.value;
    const lastName = signupLname.value;
    const email = signupEmail.value;
    const password = signupPassword.value;
    
    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Creating Account...';

    try {
        const response = await fetch('http://localhost:5000/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            handleSuccessfulAuth(data.user);
        } else {
            alert(data.error || 'Failed to create account');
            submitBtn.textContent = originalBtnText;
        }
    } catch (err) {
        console.error(err);
        alert('Could not connect to server.');
        submitBtn.textContent = originalBtnText;
    }
});

forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    tempResetEmail = email;
    
    const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';

    try {
        const response = await fetch('http://localhost:5000/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, context: 'reset_password' })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('otp-input').value = '';
            showOtpVerificationForm('reset_password');
        } else {
            alert(data.error || 'Failed to send OTP');
        }
    } catch (err) {
        console.error(err);
        alert('Could not connect to server.');
    } finally {
        submitBtn.textContent = originalBtnText;
    }
});

otpVerificationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const otp = document.getElementById('otp-input').value;
    const email = tempResetEmail;
    
    const submitBtn = otpVerificationForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Verifying...';

    try {
        const response = await fetch('http://localhost:5000/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, context: 'reset_password' })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResetPasswordForm();
        } else {
            alert(data.error || 'Invalid OTP');
        }
    } catch (err) {
        console.error(err);
        alert('Could not connect to server.');
    } finally {
        submitBtn.textContent = originalBtnText;
    }
});

resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('reset-password-input').value;
    const confirmPassword = document.getElementById('reset-confirm').value;
    const errorEl = document.getElementById('reset-password-error');
    
    if (newPassword !== confirmPassword) {
        errorEl.style.display = 'block';
        return;
    }
    errorEl.style.display = 'none';
    
    const submitBtn = resetPasswordForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Resetting...';

    try {
        const response = await fetch('http://localhost:5000/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: tempResetEmail, password: newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Password reset successfully! Please sign in.');
            showSigninForm();
        } else {
            alert(data.error || 'Failed to reset password');
        }
    } catch (err) {
        console.error(err);
        alert('Could not connect to server.');
    } finally {
        submitBtn.textContent = originalBtnText;
    }
});

const signinEmail = document.getElementById('signin-email');
const signupEmail = document.getElementById('signup-email');
const signupFname = document.getElementById('signup-fname');
const signupLname = document.getElementById('signup-lname');

function handleSuccessfulAuth(user) {
    currentUser = user;
    localStorage.setItem('interner_user', JSON.stringify(user));

    // Simulate successful login/registration
    isLoggedIn = true;
    signinModal.style.display = 'none';
    loginBtn.textContent = 'Sign Out';

    if (user.email) {
        profileEmail.textContent = user.email;
        if (attrEmail) attrEmail.textContent = user.email;
    }

    if (user.name) {
        profileName.textContent = user.name;
        if (attrName) attrName.textContent = user.name;
    }

    const userSkills = Array.isArray(user.skills)
        ? user.skills.filter(skill => typeof skill === 'string' && skill.trim())
        : [];
    if (profileSkillsContainer) {
        profileSkillsContainer.replaceChildren();
        if (userSkills.length) {
            userSkills.forEach(skill => {
                const badge = document.createElement('span');
                badge.className = 'skill-badge matched';
                badge.textContent = skill;
                profileSkillsContainer.appendChild(badge);
            });
        } else {
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'profile-empty-skills';
            emptyMessage.textContent = 'No skills saved yet. Edit your profile to add skills.';
            profileSkillsContainer.appendChild(emptyMessage);
        }
    }
    updateProfileInsights(user);

    // Allow focusing and resume any pending actions
    skillInput.focus();

    // Reset form states
    const submitBtnIn = signinForm.querySelector('button[type="submit"]');
    if (submitBtnIn) submitBtnIn.textContent = 'Sign In';
    const submitBtnUp = signupForm.querySelector('button[type="submit"]');
    if (submitBtnUp) submitBtnUp.textContent = 'Create Account';

    loginBtn.addEventListener('click', handleLogout, { once: true });
}

function handleLogout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('interner_user');

    loginBtn.textContent = 'Sign In';
    resultsSection.style.display = 'none';
    aboutSection.style.display = 'block';
    skillInput.value = '';

    // reset to discover view
    discoverView.style.display = 'block';
    profileView.style.display = 'none';
    navDiscover.classList.add('active');
    navProfile.classList.remove('active');

    // reset profile values visually (optional)

    // Add original login listener back
    loginBtn.addEventListener('click', () => {
        signinModal.style.display = 'flex';
    }, { once: true });
}

function requireAuth() {
    if (!isLoggedIn) {
        skillInput.blur(); // Remove focus
        signinModal.style.display = 'flex';
        return true;
    }
    return false;
}

// Search Logic
async function handleSearch() {
    if (requireAuth()) return; // Stop if not logged in

    const query = skillInput.value.trim().toLowerCase();
    const selectedCategory = categoryInput.value;

    if (!query && !selectedCategory) {
        skillInput.focus();
        // Add a pulsing effect to input if empty
        skillInput.parentElement.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)';
        setTimeout(() => skillInput.parentElement.style.boxShadow = '', 1000);
        return;
    }

    querySkills = getSkillTerms([query]);

    // Show UI states
    resultsSection.style.display = 'block';
    aboutSection.style.display = 'none';
    internshipsGrid.style.display = 'none';
    noResults.style.display = 'none';
    loader.style.display = 'flex';

    // Smooth scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    try {
        await loadInternships();
        findMatches(querySkills);
    } catch (error) {
        console.error('Unable to load internships:', error);
        loader.style.display = 'none';
        noResults.querySelector('h3').textContent = 'Internships are unavailable';
        noResults.querySelector('p').textContent = 'Please make sure the application server is running, then try again.';
        noResults.style.display = 'block';
        internshipsGrid.style.display = 'none';
    }
}

async function loadInternships() {
    if (internDatabase.length) return;

    const response = await fetch('http://localhost:5000/internships');
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || 'The internship request failed.');
    }
    if (!Array.isArray(data.internships)) {
        throw new Error('The internship response was not in the expected format.');
    }

    internDatabase = data.internships;
    populateFilterOptions(locationInput, internDatabase.map(item => item.location));
    populateFilterOptions(categoryInput, internDatabase.map(item => item.category));
    if (currentUser) updateProfileInsights(currentUser);
}

function populateFilterOptions(select, values) {
    const selectedValue = select.value;
    while (select.options.length > 1) {
        select.remove(1);
    }

    [...new Set(values)].sort((a, b) => a.localeCompare(b)).forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });

    if ([...select.options].some(option => option.value === selectedValue)) {
        select.value = selectedValue;
    }
}

function findMatches(skills) {
    const selectedLocation = locationInput.value.toLowerCase().replace(/,\s*india$/, '');
    const selectedCategory = categoryInput.value.toLowerCase();

    // Score each internship based on matching skills
    const scoredInternships = internDatabase.map(internship => {
        const matchedSkills = getMatchedSkills(internship.skills, skills);
        const matchScore = matchedSkills.length;

        const internLocation = internship.location.toLowerCase().replace(/,\s*india$/, '');
        const locationMatches = !selectedLocation
            || (selectedLocation === 'remote' ? internLocation === 'remote'
                : internLocation === selectedLocation || internLocation === 'remote');
        const categoryMatches = !selectedCategory || internship.category.toLowerCase() === selectedCategory;

        return { ...internship, matchScore, matchedSkills, locationMatches, categoryMatches };
    });

    currentResults = scoredInternships.filter(item =>
        item.locationMatches
        && item.categoryMatches
        && (skills.length === 0 || item.matchScore > 0)
    );

    loader.style.display = 'none';
    noResults.querySelector('h3').textContent = 'No internships found';
    noResults.querySelector('p').textContent = 'Try different skills, locations, or categories.';

    if (currentResults.length > 0) {
        resultsTitle.textContent = `Found ${currentResults.length} matches`;
        renderInternships(currentResults);
        internshipsGrid.style.display = 'grid';
    } else {
        noResults.style.display = 'block';
        internshipsGrid.style.display = 'none';
    }
}

function renderInternships(data) {
    // Sort logic
    const sortType = sortSelect.value;
    let sortedData = [...data];

    if (sortType === 'match') {
        sortedData.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortType === 'stipend') {
        sortedData.sort((a, b) => {
            const valA = parseInt(a.stipend.replace(/[^0-9]/g, '')) || 0;
            const valB = parseInt(b.stipend.replace(/[^0-9]/g, '')) || 0;
            return valB - valA;
        });
    } else if (sortType === 'duration') {
        sortedData.sort((a, b) => parseInt(a.duration, 10) - parseInt(b.duration, 10));
    }

    internshipsGrid.innerHTML = '';

    sortedData.forEach((internship, index) => {
        // Generate skill badges
        const skillsHtml = internship.skills.map(skill => {
            const isMatched = internship.matchedSkills.includes(skill);
            return `<span class="skill-badge ${isMatched ? 'matched' : ''}">${escapeHtml(skill)}</span>`;
        }).join('');

        const card = document.createElement('div');
        card.className = 'internship-card';
        card.style.animationDelay = `${index * 0.1}s`;

        card.innerHTML = `
            <div class="card-header">
                <div class="company-info">
                    <div class="company-logo">
                        ${escapeHtml(internship.company.charAt(0))}
                    </div>
                    <div class="company-details">
                        <h3>${escapeHtml(internship.company)}</h3>
                        <p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(internship.location)} &bull; ${escapeHtml(internship.duration)}</p>
                    </div>
                </div>
                <span class="platform-badge">${escapeHtml(internship.category)}</span>
            </div>
            <div class="card-body">
                <h4>${escapeHtml(internship.role)}</h4>
                <p>${escapeHtml(internship.description)}</p>
                <p class="qualification"><strong>Qualification:</strong> ${escapeHtml(internship.qualification)}</p>
                <div class="skills-required">
                    ${skillsHtml}
                </div>
            </div>
            <div class="card-footer">
                <span class="compensation">${escapeHtml(internship.stipend)}</span>
                <a href="${escapeHtml(internship.link)}" target="_blank" rel="noopener noreferrer" class="apply-btn">View Details</a>
            </div>
        `;

        internshipsGrid.appendChild(card);
    });
}

function getSkillTerms(skills) {
    return skills.flatMap(skill => String(skill).toLowerCase().split(/[,\s;]+/)).filter(Boolean);
}

function getMatchedSkills(requiredSkills, querySkills) {
    return requiredSkills.filter(skill => {
        const skillLower = skill.toLowerCase();
        return querySkills.some(query => skillLower.includes(query) || query.includes(skillLower));
    });
}

function updateProfileInsights(user) {
    const skills = Array.isArray(user.skills)
        ? user.skills.filter(skill => typeof skill === 'string' && skill.trim())
        : [];
    profileSkillCount.textContent = String(skills.length);
    profileSkillLabel.textContent = `${skills.length} ${skills.length === 1 ? 'skill' : 'skills'}`;
    profileRecommendations.replaceChildren();

    if (!internDatabase.length) {
        profileMatchCount.textContent = '—';
        profileCategoryCount.textContent = '—';
        profileMatchSummary.textContent = 'Matching opportunities will appear when the listings are available.';
        return;
    }

    const searchTerms = getSkillTerms(skills);
    const matchingInternships = internDatabase
        .map(internship => {
            const matchedSkills = getMatchedSkills(internship.skills, searchTerms);
            return { ...internship, matchedSkills, matchScore: matchedSkills.length };
        })
        .filter(internship => internship.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);
    const matchingCategories = new Set(matchingInternships.map(internship => internship.category));

    profileMatchCount.textContent = String(matchingInternships.length);
    profileCategoryCount.textContent = String(matchingCategories.size);
    profileMatchSummary.textContent = skills.length
        ? `${matchingInternships.length} internships match your skills across ${matchingCategories.size} categories.`
        : 'Add skills to your profile to see matching opportunities.';

    matchingInternships.slice(0, 3).forEach(internship => {
        const card = document.createElement('a');
        card.className = 'profile-recommendation';
        card.href = internship.link;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';

        const title = document.createElement('h4');
        title.textContent = internship.role;
        const company = document.createElement('p');
        company.textContent = internship.company;
        const details = document.createElement('span');
        details.textContent = `${internship.location} · ${internship.category} · ${internship.stipend}`;

        card.append(title, company, details);
        profileRecommendations.appendChild(card);
    });
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

// Edit Profile Logic
const editProfileBtn = document.getElementById('edit-profile-btn');
const editProfileModal = document.getElementById('edit-profile-modal');
const closeEditProfile = document.getElementById('close-edit-profile');
const editProfileForm = document.getElementById('edit-profile-form');
const editNameInput = document.getElementById('edit-name');
const editEmailInput = document.getElementById('edit-email');
const editSkillsInput = document.getElementById('edit-skills');

if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
        // Populate current values
        editNameInput.value = attrName.textContent;
        editEmailInput.value = attrEmail.textContent;

        // Get current skills
        const currentSkills = Array.from(profileSkillsContainer.querySelectorAll('.skill-badge')).map(span => span.textContent);
        editSkillsInput.value = currentSkills.join(', ');

        editProfileModal.style.display = 'flex';
    });
}

if (closeEditProfile) {
    closeEditProfile.addEventListener('click', () => {
        editProfileModal.style.display = 'none';
    });
}

if (editProfileModal) {
    editProfileModal.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            editProfileModal.style.display = 'none';
        }
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUser) return;

        const newName = editNameInput.value.trim();
        const newEmail = editEmailInput.value.trim();
        const skillsString = editSkillsInput.value;
        const newSkills = skillsString.split(',').map(s => s.trim()).filter(Boolean);

        const subBtn = editProfileForm.querySelector('button[type="submit"]');
        const oldText = subBtn.textContent;
        subBtn.textContent = 'Saving...';

        try {
            const response = await fetch('http://localhost:5000/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: currentUser.id,
                    name: newName,
                    email: newEmail,
                    skills: newSkills
                })
            });
            
            const data = await response.json();

            if (response.ok) {
                handleSuccessfulAuth(data.user);
                editProfileModal.style.display = 'none';
            } else {
                alert(data.error || `Unable to save profile (${response.status}).`);
            }
        } catch (err) {
            console.error('Profile update failed:', err);
            alert(err instanceof TypeError
                ? 'Could not reach the profile server. Start Flask with "python server.py" and try again.'
                : 'Unable to save your profile. Please try again.');
        } finally {
            subBtn.textContent = oldText;
        }
    });
}
