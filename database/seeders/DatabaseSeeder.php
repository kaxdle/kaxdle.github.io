<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Admin;
use Hash;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        $email = 'admin@gmail.com';
        $password = 'admin';

        $hashedPassword = Hash::make($password);

        $admin = Admin::create([
            'email' => $email,
            'password' => $hashedPassword,
        ]);

        if ($admin) {
            $this->command->info('Tài khoản admin đã được chèn vào cơ sở dữ liệu.');
        } else {
            $this->command->error('Có lỗi xảy ra khi chèn tài khoản admin vào cơ sở dữ liệu.');
        }
    }
}
