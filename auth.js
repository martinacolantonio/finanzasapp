// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCDUqV8qJ_rAgbGzbDyYFRSYbayP9kjZYg",
  authDomain: "finanzasapp-c5a87.firebaseapp.com",
  projectId: "finanzasapp-c5a87",
  storageBucket: "finanzasapp-c5a87.firebasestorage.app",
  messagingSenderId: "416253504177",
  appId: "1:416253504177:web:e9ac50c635c6919eb01090",
  measurementId: "G-LNS81RHGQC"
};


if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();

const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('auth-email');
const passwordInput = document.getElementById('auth-password');
const btnSubmit = document.getElementById('btn-auth-submit');
const linkToggle = document.getElementById('link-toggle-auth');
const authTitle = document.getElementById('auth-title');
const textExplicativo = document.getElementById('text-explicativo');
const btnGoogle = document.getElementById('btn-google');

let modoLogin = true;

if (linkToggle) {
    linkToggle.addEventListener('click', (e) => {
        e.preventDefault();
        modoLogin = !modoLogin;
        if (modoLogin) {
            authTitle.innerText = "Ingresá a tu cuenta de finanzas";
            btnSubmit.innerText = "Iniciar Sesión";
            textExplicativo.innerText = "¿No tenés cuenta? ";
            linkToggle.innerText = "Registrate acá";
        } else {
            authTitle.innerText = "Creá tu cuenta de finanzas gratis";
            btnSubmit.innerText = "Registrarse";
            textExplicativo.innerText = "¿Ya tenés cuenta? ";
            linkToggle.innerText = "Iniciá sesión acá";
        }
    });
}

if (authForm) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (modoLogin) {
            try {
                await auth.signInWithEmailAndPassword(email, password);
                window.location.href = 'app.html';
            } catch (error) {
                alert("Correo o contraseña incorrectos.");
            }
        } else {
            try {
                await auth.createUserWithEmailAndPassword(email, password);
                alert("¡Cuenta creada con éxito! Ya podés iniciar sesión.");
                modoLogin = true;
                authTitle.innerText = "Ingresá a tu cuenta de finanzas";
                btnSubmit.innerText = "Iniciar Sesión";
                textExplicativo.innerText = "¿No tenés cuenta? ";
                linkToggle.innerText = "Registrate acá";
                authForm.reset();
            } catch (error) {
                alert("Error al registrarse: " + error.message);
            }
        }
    });
}

if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await auth.signInWithPopup(provider);
            window.location.href = 'app.html';
        } catch (error) {
            console.error("Error con Google: ", error);
            alert("No se pudo conectar con Google. Revisá la API Key.");
        }
    });
}