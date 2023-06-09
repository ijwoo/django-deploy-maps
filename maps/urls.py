from django.urls import path
from .views import display_map, search
from . import views
app_name = 'maps'


urlpatterns = [
    path('display-map/', display_map, name='display_map'),
    path('geocode/', views.geocode_view, name='geocode'),
    path('geocode_reverse/', views.reverse_geocode, name='geocode_reverse'),
    path('mid-point/', views.mid_point_view, name='mid_point'),
    path('search/', search, name='search'),
]