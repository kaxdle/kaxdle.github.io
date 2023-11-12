<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        //$result['data']=Category::all();
        $categories = Category::orderBy('created_at', 'desc')->paginate(5);
        return view("admin.category",['data'=>$categories]);
    }
    public function manager_category(Request $request,$id='')
    {
        if($id>0){

            $arr=Category::where(['id'=>$id])->get();

            $result['category_name']=$arr['0']->category_name;
            $result['category_slug']=$arr['0']->category_slug;
            $result['id']=$arr['0']->id;
        }else{
            $result['category_name']='';
            $result['category_slug']='';
            $result['id']=0;
        }
        return view("admin.manager_category",$result);
    }
    public function add_category(Request $request){
        $request->validate([
            'category_name' => 'required',
            'category_slug' => ($request->input('id') > 0) ? 'required' : 'required|unique:categories,category_slug',
        ]);

        $data = [
            'category_name' => $request->input('category_name'),
            'category_slug' => $request->input('category_slug'),
        ];

        $id = $request->input('id');
        if ($id > 0) {
            $category = Category::find($id);
            $category->fill($data);
            $msg = "Danh mục đã được cập nhật!";
        } else {
            $category = new Category($data);
            $msg = "Danh mục đã được chèn!";
        }

        $category->save();
        $request->session()->flash('message', $msg);
        return redirect('/admin/category');
    }
    public function delete_category(Request $request,$id){
        $model = Category::find($id);
        $model -> delete();
        $request->session()->flash('message','Danh mục đã được xóa!');
        return redirect('/admin/category');
    }

    public function back_coupons(){
        return view("admin.manager_coupons");
    }
}
