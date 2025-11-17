from django.urls import path
from .views import (
    AddressListCreateView,
    AddressDetailView,
    SetDefaultAddressView,
)

app_name = "addresses"

urlpatterns = [
    # Address CRUD endpoints
    path("", AddressListCreateView.as_view(), name="address-list-create"),
    path("<int:address_id>/", AddressDetailView.as_view(), name="address-detail"),
    path("<int:address_id>/set-default/", SetDefaultAddressView.as_view(), name="set-default-address"),
]
