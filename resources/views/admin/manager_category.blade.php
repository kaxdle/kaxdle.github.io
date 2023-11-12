@extends('admin/layout')
@section('page_title',"Quản Lí Danh Mục")

@section('container')
<h1 style="margin-bottom: 10px;">Quản Lí Danh Mục</h1>
<a href="{{url('admin/category')}}">
    <button type="button" class="btn btn-primary mb10">Quay Lại</button>
</a>
<div class="row">
        <div class="col-lg-12">
            <div class="row">
                <div class="col-lg-12">
                    {{session('message')}}
                    <div class="card">
                        <div class="card-body">
                            <form action="{{route('category.add_category')}}" method="post">
                                @csrf
                                <div class="form-group has-success">
                                    <label for="cc-name" class="control-label mb-1">Category Name</label>
                                    <input id="category_name" value="{{$category_name}}" name="category_name" type="text" class="form-control cc-name valid" data-val="true" data-val-required="Please enter the name on card"
                                        autocomplete="cc-name" aria-required="true" aria-invalid="false" required>
                                    @error('category_name')
                                    <div class="alert alert-danger" role="alert">
                                        {{$message}}
                                    </div>
                                    @enderror
                                    <span class="help-block field-validation-valid" data-valmsg-for="cc-name" data-valmsg-replace="true"></span>
                                </div>
                                <div class="form-group has-success">
                                    <label for="cc-name" class="control-label mb-1">Category Slug</label>
                                    <input id="category_slug" value="{{$category_slug}}" name="category_slug" type="text" class="form-control cc-name valid" data-val="true" data-val-required="Please enter the name on card"
                                           autocomplete="cc-name" aria-required="true" aria-invalid="false" required>
                                    @error('category_slug')
                                    <div class="alert alert-danger" role="alert">
                                        {{$message}}
                                    </div>
                                    @enderror
                                    <span class="help-block field-validation-valid" data-valmsg-for="cc-name" data-valmsg-replace="true"></span>
                                </div>

                                <div>
                                    <button id="payment-button" type="submit" class="btn btn-lg btn-info btn-block">
                                        Submit
                                    </button>
                                </div>
                                <input type="hidden" name="id" value="{{$id}}"/>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
</div>
@endsection
