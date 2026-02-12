from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Flashcard(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='cards')
    front = models.TextField() # Concept or Symptom
    back = models.TextField()  # Treatment or Definition
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.front[:30]}..."

class StudySession(models.Model):
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    total_cards = models.IntegerField(default=0)
    success_count = models.IntegerField(default=0)
    fail_count = models.IntegerField(default=0)

    def __str__(self):
        return f"Session finished at {self.end_time}"
