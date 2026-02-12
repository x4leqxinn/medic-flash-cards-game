import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods
from .models import Category, Flashcard, StudySession

@ensure_csrf_cookie
def index(request):
    return render(request, 'cards/index.html')

# --- API Categories ---

@require_http_methods(["GET", "POST"])
def api_categories(request):
    if request.method == "GET":
        categories = Category.objects.all().values('id', 'name')
        return JsonResponse(list(categories), safe=False)
    
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            if not data.get('name'):
                 return JsonResponse({'error': 'Name required'}, status=400)
            
            cat = Category.objects.create(name=data['name'])
            return JsonResponse({'id': cat.id, 'name': cat.name}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@require_http_methods(["DELETE"])
def api_category_detail(request, pk):
    cat = get_object_or_404(Category, pk=pk)
    cat.delete()
    return JsonResponse({'status': 'deleted'})

# --- API Cards ---

@require_http_methods(["GET", "POST"])
def api_cards(request):
    if request.method == "GET":
        cards = Flashcard.objects.all().values('id', 'category_id', 'front', 'back')
        return JsonResponse(list(cards), safe=False)

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            category_id = data.get('category_id')
            front = data.get('front')
            back = data.get('back')

            if not all([category_id, front, back]):
                return JsonResponse({'error': 'Missing fields'}, status=400)

            card = Flashcard.objects.create(
                category_id=category_id,
                front=front,
                back=back
            )
            return JsonResponse({
                'id': card.id,
                'category_id': card.category_id,
                'front': card.front,
                'back': card.back
            }, status=201)
        except Exception as e:
             return JsonResponse({'error': str(e)}, status=400)

@require_http_methods(["DELETE"])
def api_card_detail(request, pk):
    card = get_object_or_404(Flashcard, pk=pk)
    card.delete()
    return JsonResponse({'status': 'deleted'})


# --- API Stats ---

@require_http_methods(["POST"])
def api_stats(request):
    try:
        data = json.loads(request.body)
        total = data.get('total', 0)
        success = data.get('success', 0)
        fail = data.get('fail', 0)
        duration = data.get('duration', 0)

        session = StudySession.objects.create(
            total_cards=total,
            success_count=success,
            fail_count=fail,
            duration_seconds=duration
        )
        return JsonResponse({'id': session.id}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
