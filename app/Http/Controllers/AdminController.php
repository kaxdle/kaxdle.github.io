<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Hash;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        if($request->session()->has('ADMIN_LOGIN')){
            return redirect('/admin/dashboard');
        }else{
            return view("admin.login");
        }
        return view("admin.login");
    }
    public function auth(Request $request)
{
    $email = $request->post("email");
    $password = $request->post("password");
    $result = Admin::where(['email' => $email])->first();

    if ($result) {
        if (Hash::check($password, $result->password)) {
            $request->session()->put('ADMIN_LOGIN', true);
            $request->session()->put('ADMIN_ID', $result->id);
            return redirect('/admin/dashboard');
        } else {
            $request->session()->flash('error', 'Please enter correct login details!');
            return redirect('/');
        }
    } else {
        // Tạo tài khoản admin mới
        $newAdmin = Admin::create([
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        if ($newAdmin) {
            $request->session()->put('ADMIN_LOGIN', true);
            $request->session()->put('ADMIN_ID', $newAdmin->id);
            return redirect('/admin/dashboard');
        } else {
            $request->session()->flash('error', 'Failed to create admin account!');
            return redirect('/');
        }
    }
}
    public function dashboard(){
        return view('admin.dashboard');
    }
    public function update_password(){
        $r = Admin::find(1);
        $r->password=Hash::make('admin');
        $r->save();
    }
    public function welcome(){
        return view('welcome');
    }
    public function logout(Request $request)
    {
        $request->session()->forget('ADMIN_LOGIN');
        $request->session()->forget('ADMIN_ID');
        $request->session()->flash('success', 'You have been logged out successfully!');
        return redirect('/');
    }
}
