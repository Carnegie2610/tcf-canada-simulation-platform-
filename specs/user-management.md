# **Document Version:** 1.7.0

**Target Developer:** Ronsard Carnegie

**Project:** OBJECTIF 4C2 au TCF Canada

This architectural blueprint outlines the implementation logic, UI components, database schemas, and security protocols required to build the User Authentication, Account Management, Password Recovery, and Admin Provisioning features.

## 1. Password Visibility Toggle (Show/Hide Password UI)

Adding a password visibility toggle prevents login frustration due to typos while keeping credentials secure. This should be added to the **Sign-In Form** and the **Admin User Creation/Editing Forms**.

### A. UI/UX Interaction Design

Place an eye icon inside the password input container, absolute-positioned on the far right.

```
┌─────────────────────────────────────────────────────────────┐
│  Mot de passe                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ••••••••••••••••••••••••••                            │👁│  │ <-- Toggle Icon
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### B. Technical State Logic (React / Tailwind)

To implement this without breaking standard HTML form behaviors:

1. Maintain a local component state: `const [showPassword, setShowPassword] = useState(false);`
2. Set the `type` attribute of the `<input>` element dynamically:
    - If `showPassword` is `false` ➔ `type="password"`
    - If `showPassword` is `true` ➔ `type="text"`
3. Render the SVG icon dynamically:
    - **Eye Icon (Visible State - `type="text"`):** Use a standard open-eye SVG.
    - **Slashed Eye Icon (Hidden State - `type="password"`):** Use an eye SVG with a diagonal line through it.

## 2. Dynamic User Settings & Role Matrix

The User Settings panel acts as the control center for account settings. To keep the interface clean and secure, the navigation options and access controls must dynamically adapt based on a clear three-tier role hierarchy.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       USER SETTINGS WORKSPACE                           │
├───────────────────────────┬───────────────────────────┬─────────────────┤
│ SUPER ADMIN               │ MEMBER ADMIN              │ STUDENT         │
│ • Absolute system control │ • View user accounts      │ • View profile  │
│ • Provision all users     │ • Monitor submissions     │ • Check expiry  │
│ • Set/edit quotas & tiers │ • Trigger password resets │ • Update pass   │
│ • Trigger password resets │ • NO create/edit/delete   │                 │
└───────────────────────────┴───────────────────────────┴─────────────────┘
```

### Access Matrix Implementation

Configure your settings router or permission hooks to enforce these exact operational boundaries:

| Settings Tab / Feature | Super Admin | Member Admin | Student |
| --- | --- | --- | --- |
| **Profile Settings** (Edit Display Name, Avatar) | ✅ Yes | ✅ Yes | ✅ Yes |
| **Account Password Updates** (Change password) | ✅ Yes | ✅ Yes | ✅ Yes |
| **User Provisioning** (Create, Edit, Delete accounts) | ✅ Yes | ❌ Blocked | ❌ Blocked |
| **User Directory Viewer** (View user accounts) | ✅ Yes | ✅ Yes | ❌ Blocked |
| **Trigger Password Reset** (For other users) | ✅ Yes | ✅ Yes | ❌ Blocked |
| **Student Auditor Dashboard** (Track progress) | ✅ Yes | ✅ Yes | ❌ Blocked |
| **Combination Builder Modal** (Create/edit exams) | ✅ Yes | ✅ Yes | ❌ Blocked |
| **Quota Configuration Panel** (Override limits) | ✅ Yes | ❌ Blocked | ❌ Blocked |

## 3. Password Recovery & Reset Flow Analysis

For a closed-registration SaaS targeting immigration candidates, we compared two primary mechanisms for handling forgotten credentials.

### Comparison Matrix

| Evaluation Metric | Option A: Native Firebase Reset Link (Recommended) | Option B: Custom OTP / Verification Code |
| --- | --- | --- |
| **Implementation Effort** | **Extremely Low.** Native Firebase APIs handle token generation, cryptographically signed URLs, expiration times, and secure mail-out out of the box. | **High.** Requires building custom server-side functions, integration with transactional mail APIs (SendGrid, Mailgun), and managing temporary database OTP collections. |
| **Security Standard** | **Industry Best-Practice.** Links are single-use, tied to verified user records, and expire quickly. | **Moderate.** Risk of code interception, brute force attacks, or database pollution from expired tokens. |
| **User Experience (UX)** | **Seamless.** 1-click execution. User opens the email, clicks the link, enters their new password, and returns to the app. | **Clunky.** User must copy a multi-digit numeric code, return to the tab, type it in, and then type their new password. |

### Recommended Technical Implementation: Native Email Reset Link

We will implement the native Firebase password reset workflow. It is highly secure, reliable, and keeps development streamlined.

### Workflow A: Candidate-Initiated Reset (Self-Service)

1. On the public login page, the user clicks **"Mot de passe oublié ?"**.
2. A modal or dedicated card displays, prompting the user for their registered email address.
3. The app executes the Firebase auth check:
    
    ```
    import { getAuth, sendPasswordResetEmail } from "firebase/auth";
    
    const handlePasswordReset = async (email) => {
      const auth = getAuth();
      try {
        await sendPasswordResetEmail(auth, email);
        // Show beautiful inline success modal to the user: "Un lien de réinitialisation vous a été envoyé !"
      } catch (error) {
        // Graceful localized error handling (e.g., if email not found)
      }
    };
    ```
    
4. The user receives a secure link in French, resets their password in the secure, pre-configured Firebase portal, and returns to log in.

### Workflow B: Admin-Triggered Reset Actions (Super Admin & Member Admin Helpers)

Because accounts are provisioned manually, students may occasionally ask their instructors or platform owners to restore access directly. The platform provides helper workflows for administrators:

1. **Trigger Reset Dispatcher (Email Link):** Next to each student row in both the Super Admin and Member Admin's directory interface, add a `"Renvoyer réinitialisation"` (Send Reset Link) button. Clicking this triggers `sendPasswordResetEmail(auth, studentEmail)` programmatically on the student's behalf, instantly delivering a secure password recovery link to the student's mailbox. Both **Super Admins** and **Member Admins** can trigger this dispatcher.
2. **Direct Overwrite Option (Emergency Bypass):** The **Super Admin** can input a temporary password directly into the student editing modal, triggering a cloud function or user profile update to force the credentials change instantly and print it for manual delivery. Because **Member Admins** are strictly blocked from editing or writing user data, this direct override option is exclusively visible and usable by the **Super Admin**.

## 4. User Creation & Pricing Tier Provisioning

When the Super Admin opens the user creation modal to provision a new candidate, the default configuration and input controls must enforce the business rules requested by the client.

```
┌─────────────────────────────────────────────────────────────┐
│  Créer un compte étudiant                                   │
├─────────────────────────────────────────────────────────────┤
│  Nom complet                                                │
│  [ Jean Dupont                                           ]  │
├─────────────────────────────────────────────────────────────┤
│  Adresse e-mail                                             │
│  [ jean.dupont@email.com                                 ]  │
├─────────────────────────────────────────────────────────────┤
│  Plan de tarification (Editable)                            │
│  [ Plan Premium (10 000 CFA - 80 Sim.)                    ▾ ] │
├─────────────────────────────────────────────────────────────┤
│  Options d'accès                                            │
│  [✔] Activer les évaluations par IA (Recommandé)            │  <-- Pre-checked, non-negotiable default
│  [ ] Suspendre le compte                                    │
└─────────────────────────────────────────────────────────────┘
```

### A. Non-Negotiable Default: AI Evaluations Enabled

- **Core Principle:** Since deterministic AI scoring is the core value proposition of OBJECTIF 4C2, newly created accounts must have **`ai_evaluations_enabled` set to `true` by default**.
- **UI Design:** The creation checkbox/toggle is checked on load. The admin can manually toggle it off if a custom offline agreement requires it, but it starts as `true` automatically.

### B. Mapped Pricing Tiers & Quotas

To eliminate manual calculation errors, configure a **"Plan de tarification"** dropdown with the following presets. Selecting an option automatically pre-populates and configures the subscription properties:

1. **Plan de base (5 000 CFA):** * Pre-allocates exactly **40 unlocked simulations** and solutions.
    - Sets expiration to 30 days from creation by default.
2. **Plan Premium (10 000 CFA):** * Pre-allocates exactly **80 unlocked simulations** and solutions.
    - Sets expiration to 60 days from creation by default.
3. **Plan Personnalisé (Custom):** * Unlocks manual input fields, allowing the admin to write in any price (e.g., `15,000 CFA`), custom combination attempts quota (e.g., `120 attempts`), and custom expiration date.

### C. Mapped Database Schema (`/users/{userId}/profile`)

When the admin hits **"Créer"**, the database document for the user profile must be written exactly with this schema, guaranteeing instant client-side policy validation during simulations:

```
{
  "uid": "AUTHENTICATED_USER_UID",
  "email": "jean.dupont@email.com",
  "displayName": "Jean Dupont",
  "role": "student",
  "plan": {
    "name": "Plan Premium",
    "price_paid_cfa": 10000,
    "max_simulations_quota": 80,
    "current_simulations_used": 0
  },
  "features": {
    "ai_evaluations_enabled": true,
    "view_library_enabled": true
  },
  "account_status": "active",
  "created_at": "2026-06-09T06:03:00Z",
  "expiration_date": "2026-08-08T23:59:59Z"
}
```

## 5. All users should be able to logout in the account management 

5. Security Guardrails & Client Enforcement

To ensure your platform's intellectual property stays perfectly secure while maintaining clean, smooth user sessions, implement the following guardrails:

### A. IP Protection & Secured Copying Prevention

For both the **Library View-Only Manuals** and the **`solution_modele`** shown in the student's submission history, add a front-end wrapper to enforce strict confidentiality:

1. **Disable Mouse Selection:** Apply `select-none` (Tailwind) or `user-select: none;` (CSS) styles globally to the containers displaying proprietary study materials.
2. **Block Mouse Gestures & Right-Clicks:** Prevent users from opening context menu utilities to copy, print, or inspect elements:
    
    ```
    const preventCopyAndInspect = (e) => {
      e.preventDefault();
    };
    // Bind to container: onContextMenu={preventCopyAndInspect} onCopy={preventCopyAndInspect}
    ```
    
3. **Intercept Keyboard Shortcuts:** Prevent common screenshot/save triggers like `Ctrl+P`, `Cmd+P` (Print), and `Ctrl+S`, `Cmd+S` (Save page):
    
    ```
    useEffect(() => {
      const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'c')) {
          e.preventDefault();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    ```
    

### B. Simulation Quota Gateway

Whenever a student clicks "Commencer la simulation" in Quadrant 1, your client-side router must execute this verification check:

```
const canLaunchSimulation = (userProfile) => {
  const isWithinQuota = userProfile.plan.current_simulations_used < userProfile.plan.max_simulations_quota;
  const isActive = userProfile.account_status === "active";
  const isNotExpired = new Date(userProfile.expiration_date) > new Date();

  return isWithinQuota && isActive && isNotExpired;
};
```

If this check evaluates to `false`, the button's click behavior is bypassed, displaying a custom modal advising the candidate to contact their supervisor to upgrade or renew their account.