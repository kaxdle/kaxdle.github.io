<?php
use App\Http\Controllers\AdminController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CouponController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', [AdminController::class,'index'])->name('admin');
Route::post('admin/auth', [AdminController::class,'auth'])->name('admin.auth');
Route::group(['middleware'=> 'admin_auth'], function () {
    Route::get('/admin/dashboard', [AdminController::class,'dashboard'])->name('admin.dashboard');
    Route::get('/admin/category', [CategoryController::class,'index'])->name('admin.category');
    Route::get('/admin/category/manager_category', [CategoryController::class,'manager_category'])->name('manager_category');
    Route::post('/admin/category/add_category', [CategoryController::class,'add_category'])->name('category.add_category');
    Route::get('admin/category/delete/{id}', [CategoryController::class,'delete_category'])->name('delete_category');
    Route::get('admin/category/edit/{id}', [CategoryController::class,'manager_category'])->name('edit_category');
    Route::get('/admin/category/back_category', [CategoryController::class,'back_category'])->name('back_category');
    Route::get('/admin/category/update_password', [AdminController::class,'update_password'])->name('update_password');
    //Route phieu giam gia
    Route::get('/admin/coupons', [CouponController::class,'index'])->name('admin.coupons');
    Route::get('/admin/coupons/manager_coupons', [CouponController::class,'manager_coupons'])->name('manager_coupons');
    Route::post('/admin/coupons/add_coupons', [CouponController::class,'add_coupons'])->name('coupons.add_coupons');
    Route::get('admin/coupons/delete/{id}', [CouponController::class,'delete_coupons'])->name('delete_coupons');
    Route::get('admin/coupons/edit/{id}', [CouponController::class,'manager_coupons'])->name('edit_coupons');
    Route::get('/admin/coupons/back_coupons', [CouponController::class,'back_coupons'])->name('back_coupons');
    // Route::get('/admin/coupons/update_password', [CouponController::class,'update_password'])->name('update_password');
});
Route::get('/logout', [AdminController::class,'logout'])->name('admin.logout');
