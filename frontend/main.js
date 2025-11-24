// Configuration and state
let currentSection = 'home';
let currentUserRole = 'student';
let allData = [];
let isLoading = false;
let currentUser = null; // Store logged-in user info

// Default configuration
const defaultConfig = {
platform_title: "MindBridge",
welcome_message: "Your mental wellness journey starts here",
booking_title: "Book a Session",
library_title: "Wellness Library",
stories_title: "Share Your Story"
};

// Data handler for SDK
const dataHandler = {
onDataChanged(data) {
allData = data;
updateUI();
updateCounts();
updateDashboard();
}
};

// ========== AUTHENTICATION FUNCTIONS ==========

// Get CSRF token from cookie
function getCookie(name) {
let cookieValue = null;
if (document.cookie && document.cookie !== '') {
const cookies = document.cookie.split(';');
for (let i = 0; i < cookies.length; i++) {
const cookie = cookies[i].trim();
if (cookie.substring(0, name.length + 1) === (name + '=')) {
cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
break;
}
}
}
return cookieValue;
}

// Validation helpers
function validateEmail(email) {
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
return false;
}

// Check for common educational domains (optional - can be customized)
const eduDomains = ['.edu', '.ac.', 'student', 'university', 'college'];
const isEduEmail = eduDomains.some(domain => email.toLowerCase().includes(domain));

// For now, just warn if not edu email but still allow it
// If you want to enforce edu emails only, uncomment the next line:
// return isEduEmail;

return true;
}

function validateStudentEmail(email) {
// Strict validation for ALU student email addresses only
const emailRegex = /^[^\s@]+@alustudent\.com$/i;

if (!emailRegex.test(email)) {
return { valid: false, message: 'Please use your ALU student email (@alustudent.com)' };
}

return { valid: true };
}

function validatePassword(password) {
if (password.length < 8) {
return { valid: false, message: 'Password must be at least 8 characters' };
}
if (!/[A-Z]/.test(password)) {
return { valid: false, message: 'Password must contain at least one uppercase letter' };
}
if (!/[a-z]/.test(password)) {
return { valid: false, message: 'Password must contain at least one lowercase letter' };
}
if (!/[0-9]/.test(password)) {
return { valid: false, message: 'Password must contain at least one number' };
}
return { valid: true };
}

function validatePhone(phone) {
// Remove spaces, dashes, parentheses
const cleaned = phone.replace(/[\s\-\(\)]/g, '');
// Check if it's 10 digits (US format) or 11 digits (with country code)
return /^[0-9]{10,11}$/.test(cleaned);
}

// Show/hide modals
function showLoginModal() {
document.getElementById('login-modal').classList.remove('hidden');
}

function hideLoginModal() {
document.getElementById('login-modal').classList.add('hidden');
document.getElementById('login-form').reset();
}

function showRegisterModal() {
document.getElementById('register-modal').classList.remove('hidden');
}

function hideRegisterModal() {
document.getElementById('register-modal').classList.add('hidden');
document.getElementById('register-form').reset();
}

function switchToRegister() {
hideLoginModal();
showRegisterModal();
}

function switchToLogin() {
hideRegisterModal();
showLoginModal();
}

// Handle login - function to be called after DOM loads
function attachAuthListeners() {
// Login form
document.getElementById('login-form').addEventListener('submit', async function(e) {
e.preventDefault();

const btn = document.getElementById('login-submit-btn');
const btnText = document.getElementById('login-btn-text');
const loading = document.getElementById('login-loading');

const username = document.getElementById('login-username').value.trim();
const password = document.getElementById('login-password').value;

// Validation
if (!username || !password) {
showToast('Please fill in all fields', 'error');
return;
}

if (username.length < 3) {
showToast('Username must be at least 3 characters', 'error');
return;
}

btn.disabled = true;
btnText.textContent = 'Logging in...';
loading.classList.remove('hidden');

// Setup timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

try {
const response = await fetch('/users/api/login/', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
},
body: JSON.stringify({ username, password }),
signal: controller.signal
});

clearTimeout(timeoutId);

// Check HTTP status
if (!response.ok) {
if (response.status === 401) {
showToast('Invalid username or password', 'error');
} else if (response.status === 429) {
showToast('Too many login attempts. Please try again later.', 'error');
} else if (response.status >= 500) {
showToast('Server error. Please try again later.', 'error');
} else {
const data = await response.json().catch(() => ({}));
showToast(data.error || 'Login failed. Please try again.', 'error');
}
return;
}

const data = await response.json();

if (data.ok) {
currentUser = {
username: username,
role: data.role
};
updateAuthUI();
hideLoginModal();
showToast('Welcome back! Logged in successfully.', 'success');
} else {
showToast(data.error || 'Login failed. Please try again.', 'error');
}
} catch (error) {
clearTimeout(timeoutId);

if (error.name === 'AbortError') {
showToast('Request timed out. Please check your connection.', 'error');
} else if (error.message.includes('Failed to fetch')) {
showToast('Network error. Please check your internet connection.', 'error');
} else {
showToast('An unexpected error occurred. Please try again.', 'error');
}
console.error('Login error:', error);
} finally {
btn.disabled = false;
btnText.textContent = 'Login';
loading.classList.add('hidden');
}
});

// Register form
document.getElementById('register-form').addEventListener('submit', async function(e) {
e.preventDefault();

const btn = document.getElementById('register-submit-btn');
const btnText = document.getElementById('register-btn-text');
const loading = document.getElementById('register-loading');

// Get form values
const username = document.getElementById('register-username').value.trim();
const email = document.getElementById('register-email').value.trim();
const firstName = document.getElementById('register-firstname').value.trim();
const lastName = document.getElementById('register-lastname').value.trim();
const studentId = document.getElementById('register-studentid').value.trim();
const phone = document.getElementById('register-phone').value.trim();
const password = document.getElementById('register-password').value;
const password2 = document.getElementById('register-password2').value;

// Validation - only check required fields
if (!username || !email || !firstName || !lastName || !password || !password2) {
showToast('Please fill in all required fields', 'error');
return;
}

if (username.length < 3) {
showToast('Username must be at least 3 characters', 'error');
return;
}

if (!/^[a-zA-Z0-9_]+$/.test(username)) {
showToast('Username can only contain letters, numbers, and underscores', 'error');
return;
}

// Validate student email
const emailValidation = validateStudentEmail(email);
if (!emailValidation.valid) {
showToast(emailValidation.message, 'error');
return;
}

// Optional: validate student ID only if provided
if (studentId && studentId.length < 5) {
showToast('Student ID must be at least 5 characters', 'error');
return;
}

// Optional: validate phone only if provided
if (phone && !validatePhone(phone)) {
showToast('Please enter a valid phone number (10-11 digits)', 'error');
return;
}

const passwordValidation = validatePassword(password);
if (!passwordValidation.valid) {
showToast(passwordValidation.message, 'error');
return;
}

if (password !== password2) {
showToast('Passwords do not match!', 'error');
return;
}

btn.disabled = true;
btnText.textContent = 'Creating account...';
loading.classList.remove('hidden');

const formData = {
username: username,
email: email,
first_name: firstName,
last_name: lastName,
student_id: studentId,
phone_number: phone,
password: password,
password2: password2,
role: 'student'
};

// Setup timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

try {
const response = await fetch('/users/api/register/', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
},
body: JSON.stringify(formData),
signal: controller.signal
});

clearTimeout(timeoutId);

console.log('Registration response status:', response.status);

// Check HTTP status
if (!response.ok) {
if (response.status === 400) {
const data = await response.json().catch(() => ({}));
// Handle specific validation errors
if (data.errors) {
const errorMessages = Object.entries(data.errors)
.map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
.join('\n');
showToast(errorMessages || data.error || 'Validation failed', 'error');
} else {
showToast(data.error || 'Invalid registration data', 'error');
}
} else if (response.status === 409) {
showToast('Username or email already exists', 'error');
} else if (response.status >= 500) {
showToast('Server error. Please try again later.', 'error');
} else {
const data = await response.json().catch(() => ({}));
showToast(data.error || 'Registration failed. Please try again.', 'error');
}
return;
}

const data = await response.json();
console.log('Registration response data:', data);

if (data.ok) {
currentUser = {
username: formData.username,
role: data.role
};
updateAuthUI();
hideRegisterModal();
showToast('Account created successfully! Welcome to MindBridge.', 'success');
} else {
showToast(data.error || 'Registration failed. Please try again.', 'error');
}
} catch (error) {
clearTimeout(timeoutId);

if (error.name === 'AbortError') {
showToast('Request timed out. Please check your connection.', 'error');
} else if (error.message.includes('Failed to fetch')) {
showToast('Network error. Please check your internet connection.', 'error');
} else {
showToast('An unexpected error occurred. Please try again.', 'error');
}
console.error('Registration error:', error);
} finally {
btn.disabled = false;
btnText.textContent = 'Create Account';
loading.classList.add('hidden');
}
});
}

// Handle logout
async function handleLogout() {
// Setup timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

try {
const response = await fetch('/users/logout/', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
},
signal: controller.signal
});

clearTimeout(timeoutId);

currentUser = null;
updateAuthUI();
showSection('home');
showToast('Logged out successfully.', 'success');
} catch (error) {
clearTimeout(timeoutId);
console.error('Logout error:', error);
// Even if server request fails, clear local state
currentUser = null;
updateAuthUI();
showSection('home');
showToast('Logged out.', 'success');
}
}

// Update UI based on auth state
function updateAuthUI() {
const authButtons = document.getElementById('auth-buttons');
const userMenu = document.getElementById('user-menu');
const userName = document.getElementById('user-name');
const userInitial = document.getElementById('user-initial');

if (currentUser) {
// User is logged in
authButtons.classList.add('hidden');
userMenu.classList.remove('hidden');
userName.textContent = currentUser.username;
userInitial.textContent = currentUser.username.charAt(0).toUpperCase();
currentUserRole = currentUser.role;

// Pre-fill booking form if elements exist
const studentNameInput = document.getElementById('student-name');
const studentEmailInput = document.getElementById('student-email');
if (studentNameInput && !studentNameInput.value) {
studentNameInput.value = currentUser.username;
}
if (studentEmailInput && !studentEmailInput.value) {
studentEmailInput.value = currentUser.username + '@alustudent.com';
}

// Show/hide role-based features
const addBookBtn = document.getElementById('add-book-btn');
const studentDashboard = document.getElementById('student-dashboard');
const staffDashboard = document.getElementById('staff-dashboard');
const bookingNavBtn = document.getElementById('booking-nav-btn');
const storiesNavBtn = document.getElementById('stories-nav-btn');

if (addBookBtn && studentDashboard && staffDashboard) {
if (currentUserRole === 'wellness_team') {
addBookBtn.classList.remove('hidden');
studentDashboard.classList.add('hidden');
staffDashboard.classList.remove('hidden');
// Hide student-only navigation buttons
if (bookingNavBtn) bookingNavBtn.classList.add('hidden');
if (storiesNavBtn) storiesNavBtn.classList.add('hidden');
} else {
addBookBtn.classList.add('hidden');
studentDashboard.classList.remove('hidden');
staffDashboard.classList.add('hidden');
// Show navigation buttons for students
if (bookingNavBtn) bookingNavBtn.classList.remove('hidden');
if (storiesNavBtn) storiesNavBtn.classList.remove('hidden');
}
}
} else {
// User is not logged in
authButtons.classList.remove('hidden');
userMenu.classList.add('hidden');
}
}

// Check if user needs to be logged in for certain actions
function requireAuth(action) {
if (!currentUser) {
showToast('Please login to ' + action, 'error');
showLoginModal();
return false;
}
return true;
}

// ========== END AUTHENTICATION FUNCTIONS ==========

// Initialize SDK and app
async function initializeApp() {
try {
// Initialize Element SDK
if (window.elementSdk) {
await window.elementSdk.init({
defaultConfig,
onConfigChange: async (config) => {
document.getElementById('platform-title').textContent = config.platform_title || defaultConfig.platform_title;
document.getElementById('welcome-message').textContent = config.welcome_message || defaultConfig.welcome_message;
document.getElementById('booking-title').textContent = config.booking_title || defaultConfig.booking_title;
document.getElementById('library-title').textContent = config.library_title || defaultConfig.library_title;
document.getElementById('stories-title').textContent = config.stories_title || defaultConfig.stories_title;
},
mapToCapabilities: (config) => ({
recolorables: [
{
get: () => config.primary_color || "#1e3a8a",
set: (value) => {
config.primary_color = value;
window.elementSdk.setConfig({ primary_color: value });
}
},
{
get: () => config.accent_color || "#dc2626",
set: (value) => {
config.accent_color = value;
window.elementSdk.setConfig({ accent_color: value });
}
},
{
get: () => config.background_color || "#f9fafb",
set: (value) => {
config.background_color = value;
window.elementSdk.setConfig({ background_color: value });
}
}
],
borderables: [],
fontEditable: {
get: () => config.font_family || "Inter",
set: (value) => {
config.font_family = value;
window.elementSdk.setConfig({ font_family: value });
}
},
fontSizeable: {
get: () => config.font_size || 16,
set: (value) => {
config.font_size = value;
window.elementSdk.setConfig({ font_size: value });
}
}
}),
mapToEditPanelValues: (config) => new Map([
["platform_title", config.platform_title || defaultConfig.platform_title],
["welcome_message", config.welcome_message || defaultConfig.welcome_message],
["booking_title", config.booking_title || defaultConfig.booking_title],
["library_title", config.library_title || defaultConfig.library_title],
["stories_title", config.stories_title || defaultConfig.stories_title]
])
});
}

// Initialize Data SDK
if (window.dataSdk) {
const result = await window.dataSdk.init(dataHandler);
if (!result.isOk) {
console.error("Failed to initialize data SDK");
}
}

// Set minimum date for booking
const today = new Date().toISOString().split('T')[0];
document.getElementById('session-date').min = today;

// Setup event listeners
setupEventListeners();

// Attach authentication event listeners
attachAuthListeners();

// Initialize authentication UI
updateAuthUI();

} catch (error) {
console.error("Failed to initialize app:", error);
}
}

// Setup event listeners
function setupEventListeners() {
// Booking form
document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);

// Add book form
document.getElementById('add-book-form').addEventListener('submit', handleAddBook);

// Share story form
document.getElementById('share-story-form').addEventListener('submit', handleShareStory);

// Create event form
document.getElementById('create-event-form').addEventListener('submit', async function(e) {
e.preventDefault();

const eventId = this.getAttribute('data-event-id');
if (eventId) {
// Update existing event
await updateEvent(eventId);
} else {
// Create new event
await handleCreateEvent(e);
}
});

// Search and filter
document.getElementById('book-search').addEventListener('input', filterBooks);
document.getElementById('book-category').addEventListener('change', filterBooks);
}

// Navigation functions
function showSection(sectionName) {
// Prevent wellness team from accessing student-only sections
if (currentUser && currentUser.role === 'wellness_team') {
if (sectionName === 'booking') {
showToast('Wellness team members cannot book sessions. Students book sessions with you.', 'error');
return;
}
if (sectionName === 'stories') {
showToast('Wellness team members cannot share stories. You can moderate stories from your dashboard.', 'error');
return;
}
}

// Hide all sections
document.querySelectorAll('.section-content').forEach(section => {
section.classList.add('hidden');
});

// Show selected section
document.getElementById(sectionName + '-section').classList.remove('hidden');
currentSection = sectionName;

// Update navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.classList.remove('text-red-300');
});

// Update UI based on section
if (sectionName === 'library') {
  loadLibraryBooks();
} else if (sectionName === 'events') {
  loadEvents();
  // Hide 'My Registered Events' for wellness team
  const myRegSection = document.getElementById('my-registrations-section');
  if (myRegSection) {
    if (currentUser && currentUser.role === 'wellness_team') {
      myRegSection.classList.add('hidden');
    } else {
      myRegSection.classList.remove('hidden');
    }
  }
} else if (sectionName === 'stories') {
  renderStories();
} else if (sectionName === 'dashboard') {
  // Show appropriate dashboard based on user role
  const studentDash = document.getElementById('student-dashboard');
  const staffDash = document.getElementById('staff-dashboard');

  if (currentUser && currentUser.role === 'wellness_team') {
    if (studentDash) studentDash.classList.add('hidden');
    if (staffDash) staffDash.classList.remove('hidden');
  } else {
    if (studentDash) studentDash.classList.remove('hidden');
    if (staffDash) staffDash.classList.add('hidden');
  }

  loadBookings();
  updateCounts(); // Update stats

  // Load pending posts and events for wellness team
  if (currentUser && currentUser.role === 'wellness_team') {
    loadPendingPosts();
    loadStaffEvents();
  }
}
}

function updateUserRole() {
const role = document.getElementById('user-role').value;
currentUserRole = role;

// Show/hide staff-only features
const addBookBtn = document.getElementById('add-book-btn');
const studentDashboard = document.getElementById('student-dashboard');
const staffDashboard = document.getElementById('staff-dashboard');

if (role === 'staff') {
addBookBtn.classList.remove('hidden');
studentDashboard.classList.add('hidden');
staffDashboard.classList.remove('hidden');
} else {
addBookBtn.classList.add('hidden');
studentDashboard.classList.remove('hidden');
staffDashboard.classList.add('hidden');
}

updateDashboard();
}

// Booking functions
async function handleBookingSubmit(e) {
e.preventDefault();

if (!requireAuth('book a session')) {
return;
}

const btn = document.getElementById('book-session-btn');
const btnText = document.getElementById('book-btn-text');
const loading = document.getElementById('book-loading');

// Show loading state
btn.disabled = true;
btnText.textContent = 'Booking...';
loading.classList.remove('hidden');

// Prepare booking data
const timeValue = document.getElementById('session-time').value;
// Convert "09:00 AM" to 24-hour "09:00:00" format
let convertedTime = timeValue;
if (timeValue.includes('AM') || timeValue.includes('PM')) {
const timeParts = timeValue.match(/(\d+):(\d+)\s*(AM|PM)/i);
if (timeParts) {
let hours = parseInt(timeParts[1]);
const minutes = timeParts[2];
const period = timeParts[3].toUpperCase();

if (period === 'PM' && hours !== 12) hours += 12;
if (period === 'AM' && hours === 12) hours = 0;

convertedTime = `${hours.toString().padStart(2, '0')}:${minutes}:00`;
}
} else {
convertedTime = timeValue + ':00';
}

const bookingData = {
full_name: document.getElementById('student-name').value,
email: document.getElementById('student-email').value,
phone_number: '+250000000000', // Default phone
date: document.getElementById('session-date').value,
time: convertedTime,
session_type: 'individual',
reason: document.getElementById('specialist-select').value,
additional_notes: document.getElementById('session-notes').value
};

try {
console.log('Sending booking data:', bookingData);
const response = await fetch('/api/bookings/', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
},
body: JSON.stringify(bookingData)
});

if (!response.ok) {
let error;
const contentType = response.headers.get('content-type');

if (contentType && contentType.includes('application/json')) {
error = await response.json();
console.error('Booking error response:', error);
console.error('Full error object:', JSON.stringify(error, null, 2));

// Build detailed error message
let errorMessage = 'Booking failed: ';
if (typeof error === 'object') {
if (error.detail) {
errorMessage += error.detail;
} else {
// Show all field errors
errorMessage += Object.entries(error)
.map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
.join('; ');
}
} else {
errorMessage += error || 'Unknown error';
}
throw new Error(errorMessage);
} else {
// Server returned HTML error page
const errorText = await response.text();
console.error('Server error (HTML):', errorText.substring(0, 500));
throw new Error(`Server error (${response.status}). Check browser console and Django terminal for details.`);
}
}

const data = await response.json();
showToast("Session booked successfully! You'll receive a confirmation once approved.", "success");
document.getElementById('booking-form').reset();

// Refresh bookings if on dashboard
if (currentSection === 'dashboard') {
await loadBookings();
}

} catch (error) {
showToast(error.message || 'Failed to book session. Please try again.', 'error');
console.error('Booking error:', error);
} finally {
btn.disabled = false;
btnText.textContent = 'Book Session';
loading.classList.add('hidden');
}
}

// Load user's bookings
async function loadBookings() {
if (!currentUser) return;

console.log('Loading bookings for user:', currentUser);

try {
const response = await fetch('/api/bookings/', {
headers: {
'X-CSRFToken': getCookie('csrftoken')
}
});

if (!response.ok) throw new Error('Failed to load bookings');

const bookings = await response.json();
console.log('Loaded bookings:', bookings);
displayBookings(bookings.results || bookings);

} catch (error) {
console.error('Error loading bookings:', error);
showToast('Failed to load bookings', 'error');
}
}

// Display bookings in dashboard
function displayBookings(bookings) {
// Determine which container to use based on user role
const isWellnessTeam = currentUser && currentUser.role === 'wellness_team';
const containerId = isWellnessTeam ? 'staff-bookings-list' : 'student-bookings-list';
const container = document.getElementById(containerId);

if (!container) {
console.error('Bookings container not found:', containerId);
return;
}

console.log('Displaying bookings:', bookings);
console.log('Current user:', currentUser);
console.log('Using container:', containerId);

if (bookings.length === 0) {
container.innerHTML = '<p class="text-gray-500 text-center py-8">No bookings yet. Book your first session!</p>';
return;
}

console.log('Is wellness team?', isWellnessTeam);

container.innerHTML = bookings.map(booking => {
console.log('Rendering booking:', booking);
return `
<div class="bg-white rounded-lg shadow p-6 border-l-4 ${getStatusColor(booking.status)}">
<div class="flex justify-between items-start mb-4">
<div>
<h4 class="font-semibold text-gray-900">${formatDate(booking.date)} at ${formatTime(booking.time)}</h4>
<p class="text-sm text-gray-600">${booking.session_type}</p>
${isWellnessTeam ? `<p class="text-sm text-blue-600 mt-1">Student: ${booking.student_name || booking.student_username}</p>` : ''}
</div>
<span class="px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(booking.status)}">
${booking.status.toUpperCase()}
</span>
</div>
<p class="text-gray-700 mb-2"><strong>Reason:</strong> ${booking.reason}</p>
${booking.additional_notes ? `<p class="text-gray-600 text-sm mb-2">${booking.additional_notes}</p>` : ''}

${booking.meet_link ? (() => {
  // Check if meeting is still accessible (within session time + 40 minutes)
  const sessionDateTime = new Date(`${booking.date}T${booking.time}`);
  const sessionEndTime = new Date(sessionDateTime.getTime() + 40 * 60000); // Add 40 minutes
  const now = new Date();
  const isBeforeSession = now < sessionDateTime;
  const isDuringSession = now >= sessionDateTime && now <= sessionEndTime;
  const isAfterSession = now > sessionEndTime;
  
  if (isAfterSession) {
    return `
      <div class="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
          </svg>
          <span class="text-gray-700 font-medium">Session Completed</span>
        </div>
      </div>
    `;
  } else if (isDuringSession) {
    return `
      <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
            </svg>
            <span class="text-green-800 font-medium">🔴 Session Live Now!</span>
          </div>
          <a href="${booking.meet_link}" target="_blank" 
            class="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors animate-pulse">
            Join Meeting
          </a>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <svg class="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
            </svg>
            <span class="text-blue-800 font-medium">Google Meet Ready</span>
          </div>
          <a href="${booking.meet_link}" target="_blank" 
            class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            Join Meeting
          </a>
        </div>
        <p class="text-blue-700 text-sm mt-2">Available from session start time</p>
      </div>
    `;
  }
})() : booking.status === 'approved' ? `
<div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
<p class="text-blue-800 text-sm">Meeting link will be provided shortly</p>
</div>
` : ''}

${isWellnessTeam && booking.status === 'pending' ? `
<div class="mt-4 flex gap-2">
<button onclick="approveBooking(${booking.id})" 
class="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">Approve & Generate Meet Link
</button>
<button onclick="rejectBooking(${booking.id})" 
class="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">Reject
</button>
</div>
` : !isWellnessTeam && (booking.status === 'pending' || booking.status === 'approved') ? `
<button onclick="cancelBooking(${booking.id})" 
class="mt-4 text-red-600 hover:text-red-800 text-sm font-medium">
Cancel Booking
</button>
` : ''}
</div>
`;
}).join('');
}

// Cancel booking
async function cancelBooking(bookingId) {
if (!confirm('Are you sure you want to cancel this booking?')) return;

try {
const response = await fetch(`/api/bookings/${bookingId}/cancel/`, {
method: 'POST',
headers: {
'X-CSRFToken': getCookie('csrftoken')
}
});

if (!response.ok) throw new Error('Failed to cancel booking');

showToast('Booking cancelled successfully', 'success');
await loadBookings();

} catch (error) {
showToast(error.message || 'Failed to cancel booking', 'error');
console.error('Cancel error:', error);
}
}

// Approve booking (Wellness Team only)
async function approveBooking(bookingId) {
  if (!confirm('Approve this booking? A Google Meet link will be created and the student will receive an email invitation.')) return;
  
  try {
    const response = await fetch(`/api/bookings/${bookingId}/approve/`, {
method: 'POST',
headers: {
'X-CSRFToken': getCookie('csrftoken')
}
});

if (!response.ok) throw new Error('Failed to approve booking');

    const data = await response.json();
    if (data.meet_link) {
      showToast('Booking approved! Google Meet link created and invitation sent to student.', 'success');
    } else {
      showToast('Booking approved! (Google Meet link creation failed - check server logs)', 'success');
    }
    await loadBookings();
    
  } catch (error) {
    showToast(error.message || 'Failed to approve booking', 'error');
console.error('Approve error:', error);
}
}

// Reject booking (Wellness Team only)
async function rejectBooking(bookingId) {
const reason = prompt('Please provide a reason for rejection (optional):');
if (reason === null) return; // User cancelled

try {
const response = await fetch(`/api/bookings/${bookingId}/reject/`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
},
body: JSON.stringify({ notes: reason })
});

if (!response.ok) throw new Error('Failed to reject booking');

showToast('Booking rejected', 'success');
await loadBookings();

} catch (error) {
showToast(error.message || 'Failed to reject booking', 'error');
console.error('Reject error:', error);
}
}

// ========== POST MODERATION FUNCTIONS ==========

async function loadPendingPosts() {
if (!currentUser || currentUser.role !== 'wellness_team') {
return;
}

const container = document.getElementById('staff-pending-posts');
if (!container) return;

try {
const response = await fetch('/api/posts/', {
headers: {
'X-CSRFToken': getCookie('csrftoken')
}
});
console.log('Posts response status:', response.status);
if (!response.ok) {
const errorText = await response.text();
console.error('Failed to load posts:', errorText);
throw new Error('Failed to load posts');
}

const posts = await response.json();
console.log('Loaded posts:', posts);
// Handle pagination - extract results array
const postsArray = posts.results || posts;
const pendingPosts = postsArray.filter(post => !post.is_approved);
console.log('Pending posts:', pendingPosts);

if (pendingPosts.length === 0) {
container.innerHTML = '<p class="text-gray-500 text-center py-4">No pending stories to review</p>';
return;
}

container.innerHTML = pendingPosts.map(post => {
const date = new Date(post.created_at);
return `
<div class="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
<div class="flex justify-between items-start mb-2">
<div>
<span class="text-sm font-semibold text-gray-900">${post.author_name}</span>
<span class="text-xs text-gray-500 ml-2">${date.toLocaleDateString()}</span>
${post.anonymous ? '<span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Anonymous Post</span>' : ''}
</div>
</div>
<p class="text-gray-700 text-sm mb-3 whitespace-pre-wrap">${escapeHtml(post.content)}</p>
<div class="flex gap-2">
<button 
onclick="approvePost(${post.id})"
class="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-green-700 transition-colors">Approve
</button>
<button 
onclick="rejectPost(${post.id})"
class="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm font-semibold hover:bg-red-700 transition-colors">Reject
</button>
</div>
</div>
`;
}).join('');
} catch (error) {
console.error('Error loading pending posts:', error);
container.innerHTML = '<p class="text-red-500 text-center py-4">Failed to load pending stories. Check console for details.</p>';
}
}

async function approvePost(postId) {
if (!confirm('Are you sure you want to approve this story?')) {
return;
}

try {
const response = await fetch(`/api/posts/${postId}/approve/`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
}
});

if (response.ok) {
showToast('Story approved successfully', 'success');
loadPendingPosts(); // Refresh the list
// Update stats if needed
const totalStories = document.getElementById('total-stories');
if (totalStories) {
totalStories.textContent = parseInt(totalStories.textContent) + 1;
}
} else {
const error = await response.json();
showToast(error.detail || 'Failed to approve story', 'error');
}
} catch (error) {
showToast('Failed to approve story', 'error');
console.error('Approve error:', error);
}
}

async function rejectPost(postId) {
if (!confirm('Are you sure you want to reject this story? The author will need to resubmit.')) {
return;
}

try {
const response = await fetch(`/api/posts/${postId}/reject/`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
}
});

if (response.ok) {
showToast('Story rejected', 'success');
loadPendingPosts(); // Refresh the list
} else {
const error = await response.json();
showToast(error.detail || 'Failed to reject story', 'error');
}
} catch (error) {
showToast('Failed to reject story', 'error');
console.error('Reject error:', error);
}
}

// Helper functions
function getStatusColor(status) {
const colors = {
'pending': 'border-yellow-500',
'approved': 'border-green-500',
'rejected': 'border-red-500',
'completed': 'border-blue-500',
'cancelled': 'border-gray-500'
};
return colors[status] || 'border-gray-500';
}

function getStatusBadge(status) {
const badges = {
'pending': 'bg-yellow-100 text-yellow-800',
'approved': 'bg-green-100 text-green-800',
'rejected': 'bg-red-100 text-red-800',
'completed': 'bg-blue-100 text-blue-800',
'cancelled': 'bg-gray-100 text-gray-800'
};
return badges[status] || 'bg-gray-100 text-gray-800';
}

function formatDate(dateString) {
const date = new Date(dateString);
return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(timeString) {
const [hours, minutes] = timeString.split(':');
const hour = parseInt(hours);
const ampm = hour >= 12 ? 'PM' : 'AM';
const displayHour = hour % 12 || 12;
return `${displayHour}:${minutes} ${ampm}`;
}

// Library functions
function showAddBookModal() {
document.getElementById('book-modal').classList.remove('hidden');
}

function hideBookModal() {
document.getElementById('book-modal').classList.add('hidden');
document.getElementById('add-book-form').reset();
}

async function handleAddBook(e) {
e.preventDefault();

if (!currentUser || currentUser.role !== 'wellness_team') {
showToast('Only wellness team members can add books', 'error');
return;
}

const btn = document.getElementById('save-book-btn');
const btnText = document.getElementById('save-book-text');
const loading = document.getElementById('save-book-loading');

// Show loading state
btn.disabled = true;
btnText.textContent = 'Adding...';
loading.classList.remove('hidden');

try {
// Create FormData to handle file upload
const formData = new FormData();
formData.append('title', document.getElementById('book-title').value);
formData.append('author', document.getElementById('book-author').value);
formData.append('category', document.getElementById('book-category-select').value);
formData.append('description', document.getElementById('book-description').value);

// Add cover image if selected
const coverImage = document.getElementById('book-cover-image').files[0];
if (coverImage) {
formData.append('cover_image', coverImage);
}

// Add PDF file if selected
const pdfFile = document.getElementById('book-pdf-file').files[0];
if (pdfFile) {
formData.append('pdf_file', pdfFile);
}

const response = await fetch('/api/library/', {
method: 'POST',
headers: {
'X-CSRFToken': getCookie('csrftoken')
// Don't set Content-Type header - browser will set it with boundary for FormData
},
body: formData
});

if (response.ok) {
showToast("Book added successfully!", "success");
hideBookModal();
// Refresh library if on library page
if (currentSection === 'library') {
loadLibraryBooks();
}
} else {
const error = await response.json();
showToast(error.detail || 'Failed to add book', 'error');
}
} catch (error) {
showToast("An error occurred. Please try again.", "error");
console.error('Add book error:', error);
} finally {
// Reset button state
btn.disabled = false;
btnText.textContent = 'Add Book';
loading.classList.add('hidden');
}
}

async function loadLibraryBooks() {
try {
const response = await fetch('/api/library/');
if (!response.ok) throw new Error('Failed to load books');

const data = await response.json();
const books = data.results || data;
renderBooks(books);
} catch (error) {
console.error('Error loading books:', error);
showToast('Failed to load library books', 'error');
}
}

async function filterBooks() {
try {
const response = await fetch('/api/library/');
if (!response.ok) throw new Error('Failed to load books');

const data = await response.json();
let books = data.results || data;

const searchTerm = document.getElementById('book-search').value.toLowerCase();
const selectedCategory = document.getElementById('book-category').value;

if (searchTerm) {
books = books.filter(book => 
book.title.toLowerCase().includes(searchTerm) ||
book.author.toLowerCase().includes(searchTerm)
);
}

if (selectedCategory) {
books = books.filter(book => book.category === selectedCategory);
}

renderBooks(books);
} catch (error) {
console.error('Error filtering books:', error);
}
}

function renderBooks(books = []) {
const booksGrid = document.getElementById('books-grid');
const noBooksMessage = document.getElementById('no-books-message');

if (books.length === 0) {
booksGrid.classList.add('hidden');
noBooksMessage.classList.remove('hidden');
return;
}

booksGrid.classList.remove('hidden');
noBooksMessage.classList.add('hidden');

const categoryColors = {
'psychology': 'from-blue-400 to-blue-600',
'self_help': 'from-green-400 to-green-600',
'self-help': 'from-green-400 to-green-600',
'mindfulness': 'from-purple-400 to-purple-600',
'mental_health': 'from-indigo-400 to-indigo-600',
'wellbeing': 'from-pink-400 to-pink-600',
'inspiration': 'from-red-400 to-red-600',
'other': 'from-gray-400 to-gray-600'
};

booksGrid.innerHTML = books.map(book => {
const colorClass = categoryColors[book.category] || 'from-gray-400 to-gray-600';
const hasPdf = book.pdf_file && book.pdf_file !== '';
const hasCover = book.cover_image && book.cover_image !== '';
return `
<div class="bg-white rounded-xl shadow-lg overflow-hidden card-hover">
<div class="h-48 ${hasCover ? 'bg-gray-100' : `bg-gradient-to-br ${colorClass}`} flex items-center justify-center overflow-hidden">
${hasCover ? `
<img src="${book.cover_image}" alt="${escapeHtml(book.title)}" class="h-full w-auto object-contain">
` : `
<svg viewBox="0 0 200 250" class="w-32 h-40">
<rect x="20" y="20" width="160" height="210" rx="8" fill="white" opacity="0.9"/>
<rect x="30" y="40" width="140" height="4" fill="currentColor" opacity="0.8"/>
<rect x="30" y="50" width="${Math.min(140, book.title.length * 8)}" height="3" fill="#6b7280"/>
<rect x="30" y="60" width="${Math.min(140, book.author.length * 6)}" height="3" fill="#6b7280"/>
<circle cx="100" cy="130" r="25" fill="currentColor" opacity="0.2"/>
<rect x="85" y="115" width="30" height="30" rx="4" fill="currentColor" opacity="0.6"/>
</svg>
`}
</div>
<div class="p-6">
<h3 class="font-bold text-gray-900 mb-2 line-clamp-2">${escapeHtml(book.title)}</h3>
<p class="text-sm text-gray-600 mb-3">by ${escapeHtml(book.author)}</p>
<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-3 capitalize">${book.category.replace('_', ' ').replace('-', ' ')}</span>
<p class="text-sm text-gray-500 line-clamp-3 mb-4">${escapeHtml(book.description) || 'A valuable resource for mental wellness and personal growth.'}</p>
${hasPdf ? `
<a href="${book.pdf_file}" download class="inline-flex items-center justify-center w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
</svg>
Download PDF
</a>
` : `
<button disabled class="inline-flex items-center justify-center w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg font-semibold cursor-not-allowed">
<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
</svg>
Read Online
</button>
`}
</div>
</div>
`;
}).join('');
}

// Stories functions
function showStoryModal() {
if (!currentUser) {
showToast('Please login to share your story', 'error');
showLoginModal();
return;
}
document.getElementById('story-modal').classList.remove('hidden');
}

function hideStoryModal() {
document.getElementById('story-modal').classList.add('hidden');
document.getElementById('share-story-form').reset();
// Reset anonymous checkbox to checked
document.getElementById('story-anonymous').checked = true;
}

// Event Management functions (for wellness team)
function showCreateEventModal() {
if (!currentUser || currentUser.role !== 'wellness_team') {
showToast('Only wellness team members can create events', 'error');
return;
}

// Set minimum date to today
const today = new Date().toISOString().split('T')[0];
document.getElementById('event-date').setAttribute('min', today);

document.getElementById('event-modal').classList.remove('hidden');
}

function hideCreateEventModal() {
document.getElementById('event-modal').classList.add('hidden');
document.getElementById('create-event-form').reset();
// Reset button text and remove event ID
document.getElementById('create-event-text').textContent = 'Create Event';
document.getElementById('create-event-form').removeAttribute('data-event-id');
}

async function handleCreateEvent(e) {
e.preventDefault();

if (!currentUser || currentUser.role !== 'wellness_team') {
showToast('Only wellness team members can create events', 'error');
hideCreateEventModal();
return;
}

const btn = document.getElementById('create-event-btn');
const btnText = document.getElementById('create-event-text');
const loading = document.getElementById('create-event-loading');

btn.disabled = true;
btnText.textContent = 'Creating...';
loading.classList.remove('hidden');

try {
const startTime = document.getElementById('event-start-time').value;
const endTime = document.getElementById('event-end-time').value;

const formData = {
title: document.getElementById('event-title').value,
description: document.getElementById('event-description').value,
date: document.getElementById('event-date').value,
time: startTime, // Use start time for backward compatibility
start_time: startTime,
end_time: endTime,
location: document.getElementById('event-location').value,
max_participants: parseInt(document.getElementById('event-max-participants').value)
};

const response = await fetch('/api/events/', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
},
body: JSON.stringify(formData)
});

if (response.ok) {
showToast('Event created successfully!', 'success');
hideCreateEventModal();
loadEvents(); // Reload calendar
if (currentUser.role === 'wellness_team') {
loadStaffEvents(); // Reload staff events list
}
} else {
const data = await response.json();
showToast(data.error || 'Failed to create event', 'error');
}
} catch (error) {
console.error('Error:', error);
showToast('Failed to create event', 'error');
} finally {
btn.disabled = false;
btnText.textContent = 'Create Event';
loading.classList.add('hidden');
}
}

async function loadStaffEvents() {
try {
const response = await fetch('/api/events/');
const data = await response.json();
// Handle pagination - extract results array
const events = data.results || data;

const container = document.getElementById('staff-events-list');
if (events.length === 0) {
container.innerHTML = '<p class="text-gray-500 text-sm">No events created yet.</p>';
return;
}

container.innerHTML = events.map(event => {
// Format time display
let timeDisplay = event.time;
if (event.start_time && event.end_time) {
const start = new Date(`2000-01-01T${event.start_time}`);
const end = new Date(`2000-01-01T${event.end_time}`);
timeDisplay = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
} else if (event.start_time) {
const start = new Date(`2000-01-01T${event.start_time}`);
timeDisplay = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

return `
<div class="bg-white p-4 rounded-lg border border-gray-200">
<div class="flex justify-between items-start mb-2">
<div>
<h4 class="font-semibold text-gray-900">${escapeHtml(event.title)}</h4>
<p class="text-sm text-gray-600">${event.date} at ${timeDisplay}</p>
</div>
<span class="text-xs font-medium px-2 py-1 rounded ${
event.is_full ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
}">
${event.registered_count}/${event.max_participants}
</span>
</div>
<p class="text-sm text-gray-600 mb-2">${escapeHtml(event.location)}</p>
<p class="text-sm text-gray-700 mb-3">${escapeHtml(event.description)}</p>
<div class="flex gap-2">
<button onclick="viewRegistrants(${event.id})" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
View Registrants (${event.registered_count})
</button>
<button onclick="editEvent(${event.id})" class="text-sm text-purple-600 hover:text-purple-800 font-medium">
Edit
</button>
<button onclick="deleteEvent(${event.id})" class="text-sm text-red-600 hover:text-red-800 font-medium">
Delete
</button>
</div>
</div>
`;
}).join('');
} catch (error) {
console.error('Error loading staff events:', error);
document.getElementById('staff-events-list').innerHTML = 
'<p class="text-red-500 text-sm">Failed to load events</p>';
}
}

async function editEvent(eventId) {
try {
const response = await fetch(`/api/events/${eventId}/`);
const event = await response.json();

// Populate form with existing data
document.getElementById('event-title').value = event.title;
document.getElementById('event-description').value = event.description;
document.getElementById('event-date').value = event.date;
document.getElementById('event-start-time').value = event.start_time || event.time;
document.getElementById('event-end-time').value = event.end_time || event.time;
document.getElementById('event-location').value = event.location;
document.getElementById('event-max-participants').value = event.max_participants;

// Change button text and store event ID for update
document.getElementById('create-event-text').textContent = 'Update Event';
document.getElementById('create-event-form').setAttribute('data-event-id', eventId);

showCreateEventModal();
} catch (error) {
console.error('Error loading event:', error);
showToast('Failed to load event details', 'error');
}
}

async function updateEvent(eventId) {
if (!currentUser || currentUser.role !== 'wellness_team') {
showToast('Only wellness team members can update events', 'error');
hideCreateEventModal();
return;
}

const btn = document.getElementById('create-event-btn');
const btnText = document.getElementById('create-event-text');
const loading = document.getElementById('create-event-loading');

btn.disabled = true;
btnText.textContent = 'Updating...';
loading.classList.remove('hidden');

try {
const startTime = document.getElementById('event-start-time').value;
const endTime = document.getElementById('event-end-time').value;

const formData = {
title: document.getElementById('event-title').value,
description: document.getElementById('event-description').value,
date: document.getElementById('event-date').value,
time: startTime, // Use start time for backward compatibility
start_time: startTime,
end_time: endTime,
location: document.getElementById('event-location').value,
max_participants: parseInt(document.getElementById('event-max-participants').value)
};

const response = await fetch(`/api/events/${eventId}/`, {
method: 'PATCH',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
},
body: JSON.stringify(formData)
});

if (response.ok) {
showToast('Event updated successfully!', 'success');
hideCreateEventModal();
loadEvents();
loadStaffEvents();
} else {
const data = await response.json();
showToast(data.error || 'Failed to update event', 'error');
}
} catch (error) {
console.error('Error:', error);
showToast('Failed to update event', 'error');
} finally {
btn.disabled = false;
btnText.textContent = 'Update Event';
loading.classList.add('hidden');
}
}

async function deleteEvent(eventId) {
if (!confirm('Are you sure you want to delete this event? All registrations will be cancelled.')) {
return;
}

try {
const response = await fetch(`/api/events/${eventId}/`, {
method: 'DELETE',
headers: {
'X-CSRFToken': getCookie('csrftoken')
}
});

if (response.ok) {
showToast('Event deleted successfully', 'success');
loadEvents();
loadStaffEvents();
} else {
showToast('Failed to delete event', 'error');
}
} catch (error) {
console.error('Error:', error);
showToast('Failed to delete event', 'error');
}
}

async function viewRegistrants(eventId) {
try {
const response = await fetch(`/api/event-registrations/?event=${eventId}`);
const data = await response.json();
// Handle pagination - extract results array
const registrations = data.results || data;

let message = registrations.length === 0 
? 'No registrations yet.' 
: `Registered participants:\n\n${registrations.map(r => 
`• ${r.student_name} (${new Date(r.registered_at).toLocaleDateString()})`
).join('\n')}`;

alert(message);
} catch (error) {
console.error('Error:', error);
showToast('Failed to load registrants', 'error');
}
}

async function handleShareStory(e) {
e.preventDefault();

if (!currentUser) {
showToast('Please login to share your story', 'error');
hideStoryModal();
showLoginModal();
return;
}

const btn = document.getElementById('share-story-btn');
const btnText = document.getElementById('share-story-text');
const loading = document.getElementById('share-story-loading');

const content = document.getElementById('story-content').value.trim();
const category = document.getElementById('story-category').value;
const anonymous = document.getElementById('story-anonymous').checked;

if (!content) {
showToast('Please write your story', 'error');
return;
}

if (!category) {
showToast('Please select a category', 'error');
return;
}

// Show loading state
btn.disabled = true;
btnText.textContent = 'Sharing...';
loading.classList.remove('hidden');

try {
const response = await fetch('/api/posts/', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
},
body: JSON.stringify({
content: content,
category: category,
anonymous: anonymous
})
});

if (response.ok) {
const data = await response.json();
showToast("Story shared successfully! It will appear after wellness team approval.", "success");
hideStoryModal();
// Refresh stories if on stories page
if (currentSection === 'stories') {
loadStories();
}
} else {
const error = await response.json();
showToast(error.detail || "Failed to share story. Please try again.", "error");
}
} catch (error) {
console.error('Error sharing story:', error);
showToast("An error occurred. Please try again.", "error");
} finally {
// Reset button state
btn.disabled = false;
btnText.textContent = 'Share Story';
loading.classList.add('hidden');
}
}

async function loadStories() {
const storiesFeed = document.getElementById('stories-feed');
const noStoriesMessage = document.getElementById('no-stories-message');

try {
const response = await fetch('/api/posts/');
if (!response.ok) {
throw new Error('Failed to load stories');
}

const data = await response.json();
// Handle pagination - extract results array
const posts = data.results || data;

if (posts.length === 0) {
storiesFeed.classList.add('hidden');
noStoriesMessage.classList.remove('hidden');
return;
}

storiesFeed.classList.remove('hidden');
noStoriesMessage.classList.add('hidden');

storiesFeed.innerHTML = posts.map(post => {
const date = new Date(post.created_at);
const isApproved = post.is_approved;
const isOwn = currentUser && post.author === currentUser.id;

return `
<div class="story-card rounded-lg p-6 fade-in ${!isApproved ? 'opacity-60' : ''}">
<div class="flex items-start justify-between mb-3">
<div class="flex items-center gap-2">
<h3 class="text-lg font-semibold text-gray-900">${post.author_name}</h3>
${!isApproved ? '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending Approval</span>' : ''}
</div>
<span class="text-xs text-gray-500">${date.toLocaleDateString()}</span>
</div>
<p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${escapeHtml(post.content)}</p>
<div class="mt-4 flex items-center justify-between text-sm text-gray-500">
<span>${post.anonymous ? 'ï¿½ Anonymous' : 'ðŸ‘¤ ' + post.author_name}</span>
${isOwn ? '<span class="text-blue-600">Your Story</span>' : ''}
</div>
</div>
`;
}).join('');
} catch (error) {
console.error('Error loading stories:', error);
storiesFeed.innerHTML = '<p class="text-red-500 text-center py-4">Failed to load stories. Please try again later.</p>';
}
}

function renderStories() {
// Legacy function - now handled by loadStories
loadStories();
}

// Filter stories by category
async function filterStoriesByCategory(category) {
const storiesFeed = document.getElementById('stories-feed');
const noStoriesMessage = document.getElementById('no-stories-message');

// Update active button styling
document.querySelectorAll('.story-category-btn').forEach(btn => {
if (btn.dataset.category === category) {
btn.classList.add('ring-2', 'ring-offset-1');
} else {
btn.classList.remove('ring-2', 'ring-offset-1');
}
});

try {
let url = '/api/posts/';
if (category) {
url += `?category=${category}`;
}

const response = await fetch(url);
if (!response.ok) {
throw new Error('Failed to load stories');
}

const data = await response.json();
const posts = data.results || data;

if (posts.length === 0) {
storiesFeed.classList.add('hidden');
noStoriesMessage.classList.remove('hidden');
return;
}

storiesFeed.classList.remove('hidden');
noStoriesMessage.classList.add('hidden');

// Render filtered stories (reuse the same rendering logic)
storiesFeed.innerHTML = posts.map(post => {
const date = new Date(post.created_at);
const isApproved = post.is_approved;
const isOwn = currentUser && post.author === currentUser.id;

const categoryColors = {
'overcoming_anxiety': 'bg-blue-100 text-blue-800',
'academic_stress': 'bg-green-100 text-green-800',
'personal_growth': 'bg-purple-100 text-purple-800',
'relationships': 'bg-pink-100 text-pink-800',
'self_care': 'bg-yellow-100 text-yellow-800',
'general_inspiration': 'bg-indigo-100 text-indigo-800'
};
const categoryColor = categoryColors[post.category] || 'bg-gray-100 text-gray-800';

return `
<div class="story-card rounded-lg p-6 fade-in ${!isApproved ? 'opacity-60' : ''}">
<div class="flex items-start justify-between mb-3">
<div class="flex items-center gap-2">
<h3 class="text-lg font-semibold text-gray-900">${post.author_name}</h3>
${post.category_display ? `<span class="text-xs ${categoryColor} px-2 py-1 rounded-full">${post.category_display}</span>` : ''}
${!isApproved ? '<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending Approval</span>' : ''}
</div>
<span class="text-xs text-gray-500">${date.toLocaleDateString()}</span>
</div>
<p class="text-gray-700 leading-relaxed whitespace-pre-wrap">${escapeHtml(post.content)}</p>
<div class="mt-4 flex items-center justify-between text-sm text-gray-500">
<span>${post.anonymous ? '🔒 Anonymous' : '👤 ' + post.author_name}</span>
${isOwn ? '<span class="text-blue-600">Your Story</span>' : ''}
</div>
</div>
`;
}).join('');
} catch (error) {
console.error('Error filtering stories:', error);
storiesFeed.innerHTML = '<p class="text-red-500 text-center py-4">Failed to load stories. Please try again later.</p>';
}
}


// Helper function to escape HTML
function escapeHtml(text) {
const map = {
'&': '&amp;',
'<': '&lt;',
'>': '&gt;',
'"': '&quot;',
"'": '&#039;'
};
return text.replace(/[&<>"']/g, m => map[m]);
}

// ========== EVENTS FUNCTIONS ==========

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allEvents = [];
let selectedDate = null;

function renderCalendar() {
const monthNames = ["January", "February", "March", "April", "May", "June",
"July", "August", "September", "October", "November", "December"];

document.getElementById('calendar-month-year').textContent = 
`${monthNames[currentMonth]} ${currentYear}`;

const firstDay = new Date(currentYear, currentMonth, 1).getDay();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
const calendarDays = document.getElementById('calendar-days');

calendarDays.innerHTML = '';

// Add empty cells for days before month starts
for (let i = 0; i < firstDay; i++) {
const emptyDay = document.createElement('div');
emptyDay.className = 'aspect-square';
calendarDays.appendChild(emptyDay);
}

// Add days of the month
const today = new Date();
today.setHours(0, 0, 0, 0);

for (let day = 1; day <= daysInMonth; day++) {
const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const dayDate = new Date(currentYear, currentMonth, day);
dayDate.setHours(0, 0, 0, 0);

const isToday = dayDate.getTime() === today.getTime();
const isSelected = selectedDate === dateStr;
const eventsOnDay = allEvents.filter(e => e.date === dateStr);

const dayCell = document.createElement('div');
dayCell.className = `aspect-square p-1 rounded-md cursor-pointer transition-all hover:bg-purple-50 ${
isToday ? 'bg-purple-100 font-bold' : ''
} ${isSelected ? 'ring-2 ring-purple-600 bg-purple-50' : ''}`;

dayCell.innerHTML = `
<div class="text-center h-full flex flex-col items-center justify-center">
<div class="text-sm ${isToday ? 'text-purple-600' : 'text-gray-700'}">${day}</div>
${eventsOnDay.length > 0 ? `
<div class="flex justify-center gap-0.5 mt-0.5">
${eventsOnDay.slice(0, 3).map(() => 
'<div class="w-1 h-1 bg-purple-600 rounded-full"></div>'
).join('')}
${eventsOnDay.length > 3 ? '<div class="text-[10px] text-purple-600">+</div>' : ''}
</div>
` : ''}
</div>
`;

dayCell.onclick = () => filterEventsByDate(dateStr);
calendarDays.appendChild(dayCell);
}
}

function changeMonth(delta) {
currentMonth += delta;
if (currentMonth > 11) {
currentMonth = 0;
currentYear++;
} else if (currentMonth < 0) {
currentMonth = 11;
currentYear--;
}
renderCalendar();
}

function filterEventsByDate(dateStr) {
selectedDate = dateStr;
renderCalendar();
displayEvents(allEvents.filter(e => e.date === dateStr));

const date = new Date(dateStr + 'T00:00:00');
document.getElementById('events-filter-text').textContent = 
`Showing events for ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
}

function clearDateFilter() {
selectedDate = null;
renderCalendar();
displayEvents(allEvents.filter(e => {
const today = new Date().toISOString().split('T')[0];
return e.date >= today && e.is_active;
}));
document.getElementById('events-filter-text').textContent = 'Showing all upcoming events';
}

function displayEvents(events) {
const eventsGrid = document.getElementById('events-grid');
const noEventsMessage = document.getElementById('no-events-message');

if (events.length === 0) {
eventsGrid.classList.add('hidden');
noEventsMessage.classList.remove('hidden');
return;
}

eventsGrid.classList.remove('hidden');
noEventsMessage.classList.add('hidden');

eventsGrid.innerHTML = events.map(event => {
const eventDate = new Date(event.date + 'T' + (event.start_time || event.time));
const spotsClass = event.spots_remaining < 10 ? 'text-red-600' : 'text-green-600';
const startTime = event.start_time || event.time;
const endTime = event.end_time;

// Format time display
let timeDisplay = '';
if (startTime && endTime) {
const start = new Date(`2000-01-01T${startTime}`);
const end = new Date(`2000-01-01T${endTime}`);
timeDisplay = `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
} else {
timeDisplay = eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

return `
<div class="bg-white rounded-xl shadow-lg overflow-hidden card-hover">
${event.image ? `<img src="${event.image}" alt="${escapeHtml(event.title)}" class="w-full h-48 object-cover">` : `
<div class="w-full h-48 bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center">
<svg class="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
</svg>
</div>
`}
<div class="p-6">
<h3 class="text-xl font-bold text-gray-900 mb-2">${escapeHtml(event.title)}</h3>
<div class="space-y-2 mb-4 text-sm text-gray-600">
<div class="flex items-center">
<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
</svg>
${eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
</div>
<div class="flex items-center">
<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
</svg>
${timeDisplay}
</div>
<div class="flex items-center">
<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
</svg>
${escapeHtml(event.location)}
</div>
</div>
<p class="text-gray-700 text-sm mb-4 line-clamp-3">${escapeHtml(event.description)}</p>
<div class="flex justify-between items-center mb-4">
<span class="text-sm ${spotsClass} font-semibold">
${event.spots_remaining} spots left
</span>
<span class="text-xs text-gray-500">${event.registered_count}/${event.max_participants} registered</span>
</div>
${currentUser ? (event.is_registered ? `
<button onclick="unregisterFromEvent(${event.id})" class="w-full bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors">
Unregister
</button>
` : (event.is_full ? `
<button disabled class="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed">
Event Full
</button>
` : `
<button onclick="registerForEvent(${event.id})" class="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
Register Now
</button>
`)) : `
<button onclick="showLoginModal()" class="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
Login to Register
</button>
`}
</div>
</div>
`;
}).join('');
}

async function loadEvents() {
const eventsGrid = document.getElementById('events-grid');
const noEventsMessage = document.getElementById('no-events-message');

try {
const response = await fetch('/api/events/');
if (!response.ok) throw new Error('Failed to load events');

const data = await response.json();
// Handle pagination - extract results array
const events = data.results || data;
allEvents = events; // Store all events globally

// Filter upcoming events
const today = new Date().toISOString().split('T')[0];
const upcomingEvents = events.filter(event => event.date >= today && event.is_active);

// Render calendar with events
renderCalendar();

// Display events
displayEvents(upcomingEvents);

// Load user's registrations if logged in
if (currentUser) {
loadMyRegistrations();
}
} catch (error) {
console.error('Error loading events:', error);
eventsGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-red-500">Failed to load events. Please try again later.</p></div>';
}
}

async function registerForEvent(eventId) {
if (!currentUser) {
showToast('Please login to register for events', 'error');
showLoginModal();
return;
}

try {
const response = await fetch(`/api/events/${eventId}/register/`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
}
});

if (response.ok) {
showToast('Successfully registered for event!', 'success');
loadEvents(); // Refresh the events list
} else {
const error = await response.json();
showToast(error.error || 'Failed to register', 'error');
}
} catch (error) {
console.error('Error registering for event:', error);
showToast('Failed to register for event', 'error');
}
}

async function unregisterFromEvent(eventId) {
if (!confirm('Are you sure you want to unregister from this event?')) {
return;
}

try {
const response = await fetch(`/api/events/${eventId}/unregister/`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRFToken': getCookie('csrftoken')
}
});

if (response.ok) {
showToast('Successfully unregistered from event', 'success');
loadEvents(); // Refresh the events list
} else {
const error = await response.json();
showToast(error.error || 'Failed to unregister', 'error');
}
} catch (error) {
console.error('Error unregistering from event:', error);
showToast('Failed to unregister from event', 'error');
}
}

async function loadMyRegistrations() {
const container = document.getElementById('my-registrations-list');
if (!container || !currentUser) return;

try {
const response = await fetch('/api/event-registrations/');
if (!response.ok) throw new Error('Failed to load registrations');

const data = await response.json();
// Handle pagination - extract results array
const registrations = data.results || data;

if (registrations.length === 0) {
container.innerHTML = '<p class="text-gray-500">You haven\'t registered for any events yet.</p>';
return;
}

container.innerHTML = registrations.map(reg => {
return `
<div class="bg-white rounded-lg p-4 border-l-4 border-purple-500">
<h4 class="font-semibold text-gray-900">${escapeHtml(reg.event_title)}</h4>
<p class="text-sm text-gray-600 mt-1">Registered on ${new Date(reg.registered_at).toLocaleDateString()}</p>
</div>
`;
}).join('');
} catch (error) {
console.error('Error loading registrations:', error);
}
}

// Dashboard functions
function updateDashboard() {
if (currentUserRole === 'student') {
updateStudentDashboard();
} else {
updateStaffDashboard();
}
}

function updateStudentDashboard() {
const mySessions = document.getElementById('my-sessions');
const myReadingList = document.getElementById('my-reading-list');

const sessions = allData.filter(item => item.type === 'booking');
const books = allData.filter(item => item.type === 'book').slice(0, 3);

// My sessions
if (sessions.length === 0) {
mySessions.innerHTML = '<p class="text-gray-500 text-sm">No upcoming sessions</p>';
} else {
mySessions.innerHTML = sessions.slice(0, 3).map(session => `
<div class="bg-white rounded-lg p-3 border border-blue-200">
<p class="font-medium text-sm">${session.specialist}</p>
<p class="text-xs text-gray-600">${session.date} at ${session.time_slot}</p>
</div>
`).join('');
}

// Reading list
if (books.length === 0) {
myReadingList.innerHTML = '<p class="text-gray-500 text-sm">No books available</p>';
} else {
myReadingList.innerHTML = books.map(book => `
<div class="bg-white rounded-lg p-3 border border-red-200">
<p class="font-medium text-sm">${book.title}</p>
<p class="text-xs text-gray-600">by ${book.author}</p>
</div>
`).join('');
}
}

function updateStaffDashboard() {
const recentActivity = document.getElementById('recent-activity');

const recentItems = allData
.sort((a, b) => new Date(b.date) - new Date(a.date))
.slice(0, 5);

if (recentItems.length === 0) {
recentActivity.innerHTML = '<p class="text-gray-500 text-sm">No recent activity</p>';
} else {
recentActivity.innerHTML = recentItems.map(item => `
<div class="bg-white rounded-lg p-3 border border-gray-200">
<div class="flex justify-between items-start">
<div>
<p class="font-medium text-sm">${item.title}</p>
<p class="text-xs text-gray-600">${item.type} â€¢ ${new Date(item.date).toLocaleDateString()}</p>
</div>
<span class="text-xs px-2 py-1 rounded-full ${
item.type === 'booking' ? 'bg-blue-100 text-blue-800' :
item.type === 'book' ? 'bg-green-100 text-green-800' :
'bg-purple-100 text-purple-800'
}">${item.type}</span>
</div>
</div>
`).join('');
}
}

// UI update functions
function updateUI() {
if (currentSection === 'library') {
renderBooks();
} else if (currentSection === 'stories') {
renderStories();
}
}

async function updateCounts() {
try {
// Fetch bookings count
const bookingsResponse = await fetch('/api/bookings/');
const bookingsData = await bookingsResponse.json();
const sessionsCount = bookingsData.results ? bookingsData.results.length : bookingsData.length;

// Fetch posts (stories) count - only approved ones
const postsResponse = await fetch('/api/posts/');
const postsData = await postsResponse.json();
const postsArray = postsData.results || postsData;
const storiesCount = postsArray.length;

// Fetch library books count
const booksResponse = await fetch('/api/library/');
const booksData = await booksResponse.json();
const booksCount = booksData.results ? booksData.results.length : booksData.length;

// Update dashboard stats
const totalSessionsEl = document.getElementById('total-sessions');
const totalStoriesEl = document.getElementById('total-stories');
const totalBooksEl = document.getElementById('total-books');

if (totalSessionsEl) totalSessionsEl.textContent = sessionsCount;
if (totalStoriesEl) totalStoriesEl.textContent = storiesCount;
if (totalBooksEl) totalBooksEl.textContent = booksCount;

// Also update any other count displays if they exist
const sessionsCountEl = document.getElementById('sessions-count');
const booksCountEl = document.getElementById('books-count');
const storiesCountEl = document.getElementById('stories-count');

if (sessionsCountEl) sessionsCountEl.textContent = sessionsCount;
if (booksCountEl) booksCountEl.textContent = booksCount;
if (storiesCountEl) storiesCountEl.textContent = storiesCount;

} catch (error) {
console.error('Error updating counts:', error);
}
}

// Utility functions
function showToast(message, type = 'info') {
const toast = document.createElement('div');
toast.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium ${
type === 'success' ? 'bg-green-600' :
type === 'error' ? 'bg-red-600' :
'bg-blue-600'
}`;
toast.textContent = message;

document.body.appendChild(toast);

setTimeout(() => {
toast.remove();
}, 5000);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
