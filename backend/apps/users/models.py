from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django_enum import EnumField

class UserAccountManager(BaseUserManager):
    def create_user(self, email, firstname, lastname, phone, gender, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not phone:
            raise ValueError("Phone number is required")

        email = self.normalize_email(email)
        user = self.model(
            email=email,
            gender=gender,
            firstname=firstname,
            lastname=lastname,
            phone=phone,
            **extra_fields
        )
        
        user.set_password(password)
        user.save()
        return user

class UserAccount(AbstractBaseUser):
    class Gender(models.TextChoices):
        MALE = 'MALE', 'Male'
        FEMALE = 'FEMALE', 'Female'
        OTHER = 'OTHER', 'Other'
    
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        USER = 'USER', 'User'
        
    # Add any additional fields you want to include in your user model
    firstname = models.TextField()
    lastname = models.TextField()
    gender = EnumField(enum=Gender, max_length=10)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=256, db_column='password_hash')
    phone = models.CharField(max_length=15, unique=True)

    # Metadata fields
    role = EnumField(enum=Role, default=Role.USER)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    objects = UserAccountManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["firstname", "lastname", "phone"]
    
    def __str__(self):
        return f"{self.firstname} {self.lastname} ({self.email})"

    def get_full_name(self):
        return f"{self.firstname} {self.lastname}"
    
    def is_admin(self):
        return self.role == self.Role.ADMIN
    
    class Meta:
        db_table = "users"
        verbose_name = "User Account"
        verbose_name_plural = "User Accounts"
        