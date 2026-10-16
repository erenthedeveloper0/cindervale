<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\JsonResponse;

final class ProjectController extends Controller
{
    private const PAGE_SIZE = 12;

    public function index(bool $archived = false): JsonResponse
    {
        $projects = Project::query()
            ->where('archived', $archived)
            ->limit(self::PAGE_SIZE)
            ->get();

        return response()->json(['data' => $projects, 'count' => count($projects)]);
    }
}
