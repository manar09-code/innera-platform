import { Injectable, signal, WritableSignal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class TranslationService {
    private currentLang: WritableSignal<string> = signal('en');

    private translations: any = {
        'en': {
            'LOGIN_TITLE': 'Login',
            'WELCOME_HEADER': 'Welcome back',
            'HOME': 'Home',
            'FEED': 'Feed',
            'HISTORY': 'History',
            'STATS': 'Stats',
            'MESSAGES': 'Messages',
            'PROFILE': 'Profile',
            'CONFIG_AI': 'Config AI',
            'AI_ASSISTANT': 'AI Assistant',
            'LOGOUT': 'Logout',
            'POSTS': 'Posts',
            'LIKES': 'Likes',
            'COMMENTS': 'Comments',
            'TOTAL_USERS': 'Total Users',
            'TOTAL_POSTS': 'Total Posts',
            'TOTAL_MESSAGES': 'Total Messages',
            'ACTIVE_MEMBERS': 'Active Members',
            'POPULAR_POSTS': 'Popular Posts',
            'TRENDING': 'Trending',
            'PINNED': 'Pinned',
            'WRITE_COMMENT': 'Write a comment...',
            'WRITE_REPLY': 'Write a reply...',
            'SEND': 'Send',
            'SAVE': 'Save',
            'FILTERING_BY': 'Filtering by:',
            'CLEAR': 'Clear',
            'LOGIN_USER': 'Login User',
            'EMAIL': 'Email',
            'COMMUNITY_NAME': 'Community Name',
            'PASSWORD': 'Password',
            'CONFIRM_PASSWORD': 'Confirm Password',
            'LOG_IN': 'Log In',
            'SIGN_UP': 'Sign Up',
            'FORGOT_PASSWORD': 'Forgot Password?',
            'DONT_HAVE_ACCOUNT': "Don't have an account yet?",
            'ADMIN_LOGIN': 'Admin Login',
            'CREATE_ACCOUNT': 'Create User account',
            'USERNAME': 'Username',
            'ALREADY_HAVE_ACCOUNT': 'Already have account?',
            'LOGIN': 'Login',
            'VALID_EMAIL_REQUIRED': 'Valid email required',
            'REQUIRED': 'Required',
            'MIN_CHARS': 'Min 6 characters',
            'PASSWORDS_DONT_MATCH': "Passwords don't match",
            'CONNECTING': 'Connecting...',
            'CREATING': 'Creating...',
            'BACK': 'Back',
            'PREVIOUS': 'Previous',
            'NEXT': 'Next',
            'PAGE': 'Page',
            'OF': 'of',
            'NO_POSTS': 'No posts found',
            'NO_LIKES': 'No likes found',
            'NO_COMMENTS': 'No comments found',
            'MY_ACTIVITY': 'My Activity',
            'MY_POSTS': 'My Posts',
            'MY_COMMENTS': 'My Comments',
            'MY_LIKES': 'My Likes',
            'COMMUNITY_STATS': 'Community Stats'
        },
        'fr': {
            'LOGIN_TITLE': 'Connexion',
            'WELCOME_HEADER': 'Bon retour',
            'HOME': 'Accueil',
            'FEED': 'Fil d\'actualité',
            'HISTORY': 'Historique',
            'STATS': 'Statistiques',
            'MESSAGES': 'Messages',
            'PROFILE': 'Profil',
            'CONFIG_AI': 'Config IA',
            'AI_ASSISTANT': 'Assistant IA',
            'LOGOUT': 'Déconnexion',
            'POSTS': 'Publications',
            'LIKES': 'J\'aimes',
            'COMMENTS': 'Commentaires',
            'TOTAL_USERS': 'Utilisateurs Totaux',
            'TOTAL_POSTS': 'Publications Totales',
            'TOTAL_MESSAGES': 'Messages Totaux',
            'ACTIVE_MEMBERS': 'Membres Actifs',
            'POPULAR_POSTS': 'Publications Populaires',
            'TRENDING': 'Tendances',
            'PINNED': 'Épinglé',
            'WRITE_COMMENT': 'Écrire un commentaire...',
            'WRITE_REPLY': 'Répondre...',
            'SEND': 'Envoyer',
            'SAVE': 'Sauvegarder',
            'FILTERING_BY': 'Filtrer par:',
            'CLEAR': 'Effacer',
            'LOGIN_USER': 'Connexion Utilisateur',
            'EMAIL': 'Email',
            'COMMUNITY_NAME': 'Nom de la communauté',
            'PASSWORD': 'Mot de passe',
            'CONFIRM_PASSWORD': 'Confirmer le mot de passe',
            'LOG_IN': 'Se connecter',
            'SIGN_UP': 'S\'inscrire',
            'FORGOT_PASSWORD': 'Mot de passe oublié ?',
            'DONT_HAVE_ACCOUNT': "Pas encore de compte ?",
            'ADMIN_LOGIN': 'Connexion Admin',
            'CREATE_ACCOUNT': 'Créer un compte utilisateur',
            'USERNAME': 'Nom d\'utilisateur',
            'ALREADY_HAVE_ACCOUNT': 'Déjà un compte ?',
            'LOGIN': 'Connexion',
            'VALID_EMAIL_REQUIRED': 'Email valide requis',
            'REQUIRED': 'Requis',
            'MIN_CHARS': 'Min 6 caractères',
            'PASSWORDS_DONT_MATCH': "Les mots de passe ne correspondent pas",
            'CONNECTING': 'Connexion...',
            'CREATING': 'Création...',
            'BACK': 'Retour',
            'PREVIOUS': 'Précédent',
            'NEXT': 'Suivant',
            'PAGE': 'Page',
            'OF': 'de',
            'NO_POSTS': 'Aucun post trouvé',
            'NO_LIKES': 'Aucun like trouvé',
            'NO_COMMENTS': 'Aucun commentaire trouvé',
            'MY_ACTIVITY': 'Mon Activité',
            'MY_POSTS': 'Mes Publications',
            'MY_COMMENTS': 'Mes Commentaires',
            'MY_LIKES': 'Mes Likes',
            'COMMUNITY_STATS': 'Statistiques de la Communauté'
        }
    };

    constructor() {
        const savedLang = localStorage.getItem('lang');
        if (savedLang) {
            this.currentLang.set(savedLang);
        }
    }

    setLanguage(lang: string) {
        this.currentLang.set(lang);
        localStorage.setItem('lang', lang);
    }

    getLanguage() {
        return this.currentLang();
    }

    translate(key: string): string {
        return this.translations[this.currentLang()][key] || key;
    }

    // Expose current lang as signal for reactivity
    get currentLangSignal() {
        return this.currentLang;
    }
}
