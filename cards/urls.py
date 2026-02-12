from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('api/categories/', views.api_categories, name='api_categories'),
    path('api/categories/<int:pk>/', views.api_category_detail, name='api_category_detail'),
    path('api/cards/', views.api_cards, name='api_cards'),
    path('api/cards/<int:pk>/', views.api_card_detail, name='api_card_detail'),
    path('api/stats/', views.api_stats, name='api_stats'),
]
