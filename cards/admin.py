from django.contrib import admin
from .models import Category, Flashcard, StudySession

admin.site.register(Category)
admin.site.register(Flashcard)
admin.site.register(StudySession)
