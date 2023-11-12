<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    @section('page_title',"LogIn/SignUp")
    <link rel="stylesheet" href="{{asset('admin/style.css')}}">
    <!-- Fontfaces CSS-->
    <link href="{{asset('admin/css/font-face.css')}}" rel="stylesheet" media="all">
    <link href="{{asset('admin/vendor/font-awesome-4.7/css/font-awesome.min.css')}}" rel="stylesheet" media="all">
    <link href="{{asset('admin/vendor/font-awesome-5/css/fontawesome-all.min.css')}}" rel="stylesheet" media="all">
    <link href="{{asset('admin/vendor/mdi-font/css/material-design-iconic-font.min.css')}}" rel="stylesheet" media="all">

    <!-- Bootstrap CSS-->
    <link href=" {{asset('admin/vendor/bootstrap-4.1/bootstrap.min.css')}}" rel="stylesheet" media="all">

    <!-- Vendor CSS-->
    <link href=" {{asset('admin/vendor/animsition/animsition.min.css')}} " rel="stylesheet" media="all">
    <link href=" {{asset('admin/vendor/bootstrap-progressbar/bootstrap-progressbar-3.3.4.min.css')}} " rel="stylesheet" media="all">
    <link href=" {{asset('admin/vendor/wow/animate.css')}} " rel="stylesheet" media="all">
    <link href=" {{asset('admin/vendor/css-hamburgers/hamburgers.min.css')}} " rel="stylesheet" media="all">
    <link href=" {{asset('admin/vendor/slick/slick.css')}} " rel="stylesheet" media="all">
    <link href=" {{asset('admin/vendor/select2/select2.min.css')}} " rel="stylesheet" media="all">
    <link href=" {{asset('admin/vendor/perfect-scrollbar/perfect-scrollbar.css')}}" rel="stylesheet" media="all">

    <!-- Main CSS-->
    <link href="{{asset('admin/css/theme.css')}}" rel="stylesheet" media="all">
</head>
<body>
    <div class="row">
        <div class="col-md-6 mx-auto p-0">
            <div class="card-wrapper center-card">
                <div class="card">
                    <div class="login-box d-flex align-items-center justify-content-center">
                        <a href="#">
                            {{Config::get('contains.site_name')}}
                        </a>
                        <div class="login-snip">
                            <input id="tab-1" type="radio" name="tab" class="sign-in" checked>
                            <label for="tab-1" class="tab">Login</label>
                            <input id="tab-2" type="radio" name="tab" class="sign-up">
                            <label for="tab-2" class="tab">Sign Up</label>
                            <div class="login-space">
                                <form id="login-form" action="{{route('admin.auth')}}" method="POST">
                                    @csrf
                                    <div class="login">
                                        <div class="group">
                                            <label for="user" class="label">Email Address</label>
                                            <input id="user" type="text" class="input" name="email" placeholder="Enter your email address" required>
                                        </div>
                                        <div class="group">
                                            <label for="pass" class="label">Password</label>
                                            <input id="pass" type="password" class="input" name="password" data-type="password" placeholder="Enter your password" required>
                                        </div>
                                        <div class="group">
                                            <input id="check" type="checkbox" class="check" checked>
                                            {{-- <label for="check"><span class="icon"></span> Keep me Signed in</label> --}}
                                        </div>
                                        <div class="group">
                                            <input type="submit" class="button" value="Sign In">
                                        </div>

                                        <div class="alert alert-danger" role="alert">
                                            {{ session('error') }}
                                        </div>
                                        <div class="hr"></div>
                                        <div class="foot">
                                            <a href="#">Forgot Password?</a>
                                        </div>
                                    </div>
                                </form>
                                <form id="signup-form" action="/signup" method="POST">
                                    <div class="sign-up-form">
                                        <div class="group">
                                            <label for="username" class="label">Username</label>
                                            <input id="username" type="text" class="input" name="username" placeholder="Create your username">
                                        </div>
                                        <div class="group">
                                            <label for="password" class="label">Password</label>
                                            <input id="password" type="password" class="input" name="password" data-type="password" placeholder="Create your password">
                                        </div>
                                        <div class="group">
                                            <label for="confirm-password" class="label">Repeat Password</label>
                                            <input id="confirm-password" type="password" class="input" name="confirmPassword" data-type="password" placeholder="Repeat your password">
                                        </div>
                                        <div class="group">
                                            <label for="email" class="label">Email Address</label>
                                            <input id="email" type="text" class="input" name="email" placeholder="Enter your email address">
                                        </div>
                                        <div class="group">
                                            <input type="submit" class="button" value="Sign Up">
                                        </div>
                                        <div class="hr"></div>
                                        <div class="foot">
                                            <label for="tab-1">Already a member?</label>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- Jquery JS-->
    <script src=" {{asset('admin/vendor/jquery-3.2.1.min.js')}} "></script>
    <!-- Bootstrap JS-->
    <script src=" {{asset('admin/vendor/bootstrap-4.1/popper.min.js')}} "></script>
    <script src=" {{asset('admin/vendor/bootstrap-4.1/bootstrap.min.js')}} "></script>
    <!-- Vendor JS       -->
    <script src=" {{asset('admin/vendor/slick/slick.min.js')}} ">
    </script>
    <script src=" {{asset('admin/vendor/wow/wow.min.js')}} "></script>
    <script src=" {{asset('admin/vendor/animsition/animsition.min.js')}} "></script>
    <script src=" {{asset('admin/vendor/bootstrap-progressbar/bootstrap-progressbar.min.js')}} ">
    </script>
    <script src=" {{asset('admin/vendor/counter-up/jquery.waypoints.min.js')}} "></script>
    <script src=" {{asset('admin/vendor/counter-up/jquery.counterup.min.js')}} ">
    </script>
    <script src=" {{asset('admin/vendor/circle-progress/circle-progress.min.js')}} "></script>
    <script src=" {{asset('admin/vendor/perfect-scrollbar/perfect-scrollbar.js')}} "></script>
    <script src=" {{asset('admin/vendor/chartjs/Chart.bundle.min.js')}} "></script>
    <script src=" {{asset('admin/vendor/select2/select2.min.js')}} ">
    </script>

    <!-- Main JS-->
    <script src=" {{asset('admin/js/main.js')}} "></script>
</body>
</html>
