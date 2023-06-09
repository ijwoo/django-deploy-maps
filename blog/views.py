from django.shortcuts import render, redirect,get_object_or_404
from .models import Post
from django.utils import timezone
from .forms import PostForm
from django.contrib import messages
from django.http import Http404
from django.core.paginator import Paginator
from django.contrib.auth.views import LoginView, LogoutView
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import UserCreationForm
from django.db.models import Q
#글목록 

def post_list(request):
    if request.user.is_authenticated:
        posts = Post.objects.filter(Q(author=request.user) | Q(is_public=True))
    else:
        posts = Post.objects.none()
    paginator = Paginator(posts, 6)  # 한 페이지당 6개의 게시글을 보여줌
    page = request.GET.get('page')
    posts = paginator.get_page(page)
    return render(request, 'blog/post_list.html', {'posts' : posts})
#게시글 작성
def post_new(request):
    if request.method == "POST":
        form = PostForm(request.POST, request.FILES)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.published_date = timezone.now()
            post.save()
            return redirect('post_detail', pk=post.pk)
    else:
        form = PostForm()
    return render(request, 'blog/post_edit.html', {'form': form})


#임시
def post_detail(request, pk):
    post = get_object_or_404(Post, pk=pk)
    return render(request, 'blog/post_detail.html', {'post': post})

#글 수정
def post_edit(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.method == "POST":
        form = PostForm(request.POST, request.FILES, instance=post)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.published_date = timezone.now()
            post.save()
            return redirect('post_detail', pk=post.pk)
    else:
        form = PostForm(instance=post)
    return render(request, 'blog/post_edit.html', {'form': form})


# 게시글 삭제 
def post_delete(request, pk):
    post = get_object_or_404(Post, pk=pk)
    if request.method =="POST":
        post.delete()
        messages.success(request, '게시글이 삭제되었습니다.')
        return redirect('post_list')
    return render(request, 'blog/post_delete.html',{'post' : post})


class MyLoginView(LoginView):
    template_name = 'blog/login.html'

#회원가입 기능
def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
    else:
        form = UserCreationForm()
    return render(request, 'blog/registration.html', {'form': form})

#검색기능
def post_search(request):
    query = request.GET.get('q')
    if query:
        posts = Post.objects.filter(Q(title__icontains=query) | Q(content__icontains=query))
    else:
        posts = Post.objects.all()
    context = {'posts': posts, 'query': query}
    return render(request, 'blog/post_search.html', context)

#내 게시글 보기
def my_post_list(request):
    if request.user.is_authenticated:
        posts = Post.objects.filter(author=request.user)
    else:
        posts = Post.objects.none()
    paginator = Paginator(posts, 6)
    page = request.GET.get('page')
    posts = paginator.get_page(page)
    return render(request, 'blog/post_list.html', {'posts': posts})

#댓글 기능
def comment(request):
    if request.user.is_authenticated:
        pass