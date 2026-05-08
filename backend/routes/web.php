<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return response()->json([
        'name' => 'IMMO API',
        'version' => '1.0.0',
        'documentation' => '/docs',
    ]);
});
