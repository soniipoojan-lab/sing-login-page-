 
//  this code for login page when user fill the form and click the login button that time validate the form and show
//  the error message 
// when user not fill the form and click the login button and also show
//  the success message when user fill the form and click the login button and also redirect to profile page 
// when user fill the form and click the login button




 const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberInput = document.getElementById('remember');
        const messageDiv = document.getElementById('message');
        const loginBtn = loginForm.querySelector('.login-btn');



// On load: check session status and redirect if already logged in 
   async function checkSession() {
      try {
          const res = await fetch('/api/session_status', { credentials: 'same-origin' });
           if (!res.ok) return;
          const data = await res.json();
           if (data && data.logged_in) {
            const params = new URLSearchParams(window.location.search);
            const nextPage = params.get('next');
            const redirectTo = nextPage && nextPage.startsWith('/') ? nextPage : '/profiles';
            window.location.href = redirectTo;
        }
    } catch (e) {
        // ignore
    }
}

checkSession();


// this code for when page load that time check the session status and redirect to profile page 
//  when user already login
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
//  SPACE LIDHI HAASE TO AUTOMETICALLY
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            
// Clear previous message
            messageDiv.classList.remove('show', 'error', 'success');
            messageDiv.textContent = '';

// Basic validation
            if (!email || !password) {
                showMessage('Please fill in all fields', 'error');
                return;
            }

 // Show loading state ON BUTTON TO FREEZE
            loginBtn.disabled = true;
            loginBtn.classList.add('loading');

// ITS USE POST METHOD TO SEND THE DATA TO SERVER 
            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                        body: JSON.stringify({
                            email: email,
                            password: password,
                            remember: rememberInput ? rememberInput.checked : false
                        })
                });

                const data = await response.json();





// this code for when user fill the from and click the login button that time validate the form and show the error message when user not fill the form and click the login button and also show the success message when user fill the form and click the login button and also redirect to profile page 
// when user fill the form and click the login button

                if (data.success) {
                    showMessage('Login successful! Redirecting...', 'success');
// SERCH KARSE KE KYA PAGE MAJAVU NEXT DIRECT LOGIN PAGE AND PROCESS KARI NE AVI NE TO PROFILE PAGE     
                    const params = new URLSearchParams(window.location.search);
                    const nextPage = params.get('next');
                    const redirectTo = nextPage && nextPage.startsWith('/') ? nextPage : '/profiles';
                    setTimeout(() => {
                        window.location.href = redirectTo;
                    }, 1500);
                } else {
                    showMessage(data.message || 'Invalid email or password', 'error');
                    loginBtn.disabled = false;
                    loginBtn.classList.remove('loading');
                }
            } catch (error) { //IF LOGIN NA THAY  TO ERROR SHOW KARSE AND LOGIN BUTTON NE FREEZE KARSE 

                console.error('Error:', error);
                showMessage('An error occurred. Please try again.', 'error');
                loginBtn.disabled = false;
                loginBtn.classList.remove('loading');
            }
        }); 






            function showMessage(text, type) { // SUCCESSS AND ERROR MASSAHE SHOW KARSE
            messageDiv.textContent = text; // TEXT CONTENT MA MESSAGE SHOW KARSE
            messageDiv.classList.add('show', type);//SHOW CLASS ADD KARSE AND TYPE ERROR OR SUCCESS AND KARSE
        }


