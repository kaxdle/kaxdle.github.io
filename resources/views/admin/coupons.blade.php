@extends('admin/layout')
@section('page_title',"Phiếu Giảm Giá")
@section('container')
<link rel="stylesheet" href="{{asset('admin/css/paginate.css')}}">
<h1 style="margin-bottom: 10px;">Phiếu Giảm Giá</h1>
<a href="coupons/manager_coupons">
    <button type="button" class="btn btn-primary mb10">Thêm phiếu giảm giá</button>
</a>
<div class="row">
    <div class="table-responsive m-b-40">
        <table class="table table-borderless table-data3">
            <thead>
            <tr>
                <th>ID</th>
                <th>title</th>
                <th>code</th>
                <th>value</th>
                <th>Action</th>
            </tr>
            </thead>
            <tbody>

                @foreach($data as $list)
                    <tr>
                    <td>{{$list->id}}</td>
                    <td>{{$list->title}}</td>
                    <td>{{$list->code}}</td>
                    <td>{{$list->value}}</td>
                    <td>
                        <a href="{{url('admin/coupons/edit/')}}/{{$list->id}}}"><button type="button" class="btn btn-primary">Sửa</button></a>
                        <a href="{{url('admin/coupons/delete/')}}/{{$list->id}}}"><button type="button" class="btn btn-danger">Xóa</button></a>
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
