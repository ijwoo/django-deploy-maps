from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView
from .views import post_list, post_detail, post_new, post_edit, post_delete, MyLoginView

urlpatterns = [
    path('', views.post_list, name='post_list'),
    path('post/<int:pk>/', views.post_detail, name='post_detail'),
    path('post/new/', views.post_new, name='post_new'),
    path('post/<int:pk>/edit/', views.post_edit, name='post_edit'),
    path('post/<int:pk>/delete/', views.post_delete, name='post_delete'),
    path('login/', MyLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(next_page='post_list'), name='logout'),
    path('register/', views.register, name='register'),
    path('search/', views.post_search, name='post_search'),  # 검색 URL 패턴
    path('my-posts/', views.my_post_list, name='my_post_list'),
]

#/ post / 