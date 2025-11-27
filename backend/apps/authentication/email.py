from djoser import email
from djoser import utils
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator

class ActivationEmail(email.ActivationEmail):
    """
    Custom activation email that uses DOMAIN and PROTOCOL from settings
    instead of the current site from the request.
    """
    template_name = "authentication/ActivateEmail.html"
    
    def get_context_data(self):
        context = super().get_context_data()

        djoser_settings = settings.DJOSER
        
        user = context.get("user")
        try:
            context["uid"] = utils.encode_uid(user.pk)
            context["token"] = default_token_generator.make_token(user)
            context["url"] = djoser_settings.get('ACTIVATION_URL', 'verify-email?uid={uid}&token={token}').format(**context)
        except Exception:
            context["uid"] = ""
            context["token"] = ""
            context["url"] = ""
            print("Error generating activation link for user:", user)
            
        context['domain'] = djoser_settings.get('DOMAIN', 'localhost:3000')
        context['protocol'] = djoser_settings.get('PROTOCOL', 'http')
        context['site_name'] = djoser_settings.get('SITE_NAME', 'IE221')
        
        return context


class PasswordResetEmail(email.PasswordResetEmail):

    template_name = "authentication/PasswordResetEmail.html"

    def get_context_data(self):
        context = super().get_context_data()

        djoser_settings = settings.DJOSER

        context['domain'] = djoser_settings.get('DOMAIN', 'localhost:3000')
        context['protocol'] = djoser_settings.get('PROTOCOL', 'http')
        context['site_name'] = djoser_settings.get('SITE_NAME', 'IE221')

        return context

class ConfirmationEmail(email.ConfirmationEmail):
    template_name = "authentication/ConfirmationEmail.html"
    
    def get_context_data(self):
        context = super().get_context_data()
        
        djoser_settings = settings.DJOSER
        
        context['domain'] = djoser_settings.get('DOMAIN', 'localhost:3000')
        context['protocol'] = djoser_settings.get('PROTOCOL', 'http')
        context['site_name'] = djoser_settings.get('SITE_NAME', 'IE221')
        
        return context
    
class PasswordChangedConfirmationEmail(email.PasswordChangedConfirmationEmail):
    template_name = "authentication/PasswordChangedConfirmationEmail.html"
    
    def get_context_data(self):
        context = super().get_context_data()
        
        djoser_settings = settings.DJOSER
        
        context['domain'] = djoser_settings.get('DOMAIN', 'localhost:3000')
        context['protocol'] = djoser_settings.get('PROTOCOL', 'http')
        context['site_name'] = djoser_settings.get('SITE_NAME', 'IE221')
        
        return context