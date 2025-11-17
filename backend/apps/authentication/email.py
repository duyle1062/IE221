from djoser import email


class ActivationEmail(email.ActivationEmail):
    """
    Custom activation email that uses DOMAIN and PROTOCOL from settings
    instead of the current site from the request.
    """
    
    def get_context_data(self):
        context = super().get_context_data()
        
        # Override domain and protocol from Djoser settings
        from django.conf import settings
        djoser_settings = settings.DJOSER
        
        context['domain'] = djoser_settings.get('DOMAIN', 'localhost:3000')
        context['protocol'] = djoser_settings.get('PROTOCOL', 'http')
        context['site_name'] = djoser_settings.get('SITE_NAME', 'IE221')
        
        return context


class PasswordResetEmail(email.PasswordResetEmail):
    """
    Custom password reset email that uses DOMAIN and PROTOCOL from settings
    instead of the current site from the request.
    """
    
    def get_context_data(self):
        context = super().get_context_data()
        
        # Override domain and protocol from Djoser settings
        from django.conf import settings
        djoser_settings = settings.DJOSER
        
        context['domain'] = djoser_settings.get('DOMAIN', 'localhost:3000')
        context['protocol'] = djoser_settings.get('PROTOCOL', 'http')
        context['site_name'] = djoser_settings.get('SITE_NAME', 'IE221')
        
        return context
