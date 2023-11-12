@extends('admin/layout')
@section('page_title',"Danh Mục")
@section('container')
<link rel="stylesheet" href="{{asset('admin/css/paginate.css')}}">
<h1 style="margin-bottom: 10px;">Danh Mục</h1>
<a href="category/manager_category">
    <button type="button" class="btn btn-primary mb10">Thêm Danh Mục</button>
</a>
<div class="row">
    <div class="table-responsive m-b-40">
        <table class="table table-borderless table-data3">
            <thead>
            <tr>
                <th>ID</th>
                <th>Category Name</th>
                <th>Category Slug</th>
                <th>Action</th>
            </tr>
            </thead>
            <tbody>

                @foreach($data as $list)
                    <tr>
                    <td>{{$list->id}}</td>
                    <td>{{$list->category_name}}</td>
                    <td>{{$list->category_slug}}</td>
                    <td>
                        <a href="{{url('admin/category/edit/')}}/{{$list->id}}}"><button type="button" class="btn btn-primary">Sửa</button></a>
                        <a href="{{url('admin/category/delete/')}}/{{$list->id}}}"><button type="button" class="btn btn-danger">Xóa</button></a>
                    </td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="d-flex justify-between flex-1 sm:hidden relative z-0 inline-flex shadow-sm rounded-md">
            {{$data->links()}}
        </div>
    </div>
    {{session('message')}}
</div>
@endsection
