<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Work;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Inertia\Inertia;
use Inertia\Response;

class WorkController extends Controller
{
    public function index()
    {
        // The controller now only has to render the page component.
        // The data will be fetched by the frontend.
        return Inertia::render('projekti/Radovi');
    }
}
