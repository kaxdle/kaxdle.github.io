<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index()
    {
        // $result['data']=Coupon::all();
        // return view("admin.coupons",$result);

        $counpons = Coupon::orderBy('created_at', 'desc')->paginate(5);
        return view("admin.coupons",['data'=>$counpons]);
    }
    public function manager_coupons(Request $request,$id='')
    {
        if($id>0){

            $arr=Coupon::where(['id'=>$id])->get();

            $result['title']=$arr['0']->title;
            $result['code']=$arr['0']->code;
            $result['value']=$arr['0']->value;
            $result['id']=$arr['0']->id;
        }else{
            $result['title']='';
            $result['code']='';
            $result['value']='';
            $result['id']=0;
        }
        return view("admin.manager_coupons",$result);
    }
    public function add_coupons(Request $request){
        $request->validate([
            'title' => 'required',
            'code' => ($request->input('id') > 0) ? 'required' : 'required|unique:coupons,code',
            'value' => 'required',
        ]);

        $data = [
            'title' => $request->input('title'),
            'code' => $request->input('code'),
            'value'=> $request->input('value'),
        ];

        $id = $request->input('id');
        if ($id > 0) {
            $model = Coupon::find($id);
            $model->fill($data);
            $msg="Phiếu giảm giá đã được cập nhật!";
        } else {
            $model = new Coupon($data);
            $msg="Phiếu giảm giá đã được chèn!";
        }

        $model->save();
        $request->session()->flash('message',$msg);
        return redirect('/admin/coupons');
    }
    public function delete_coupons(Request $request,$id){
        $model = Coupon::find($id);
        $model -> delete();
        $request->session()->flash('message','Phiếu giảm giá đã được xóa!');
        return redirect('/admin/coupons');
    }

    public function back_category(){
        return view("admin.manager_coupons");
    }
}
