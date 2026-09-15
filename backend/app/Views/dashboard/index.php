<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>CivilPro Dashboard</title>

    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: Arial, sans-serif;
            background: #f4f6f9;
            color: #1f2937;
        }

        .header {
            height: 64px;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
        }

        .brand {
            font-size: 22px;
            font-weight: 700;
            color: #0f766e;
        }

        .user-area {
            display: flex;
            align-items: center;
            gap: 18px;
        }

        .logout {
            color: #dc2626;
            text-decoration: none;
            font-weight: 600;
        }

        .layout {
            display: flex;
            min-height: calc(100vh - 64px);
        }

        .sidebar {
            width: 240px;
            background: #0f172a;
            padding: 24px 16px;
        }

        .sidebar a {
            display: block;
            color: #cbd5e1;
            text-decoration: none;
            padding: 13px 16px;
            margin-bottom: 7px;
            border-radius: 7px;
        }

        .sidebar a:hover,
        .sidebar a.active {
            background: #0f766e;
            color: #ffffff;
        }

        .content {
            flex: 1;
            padding: 30px;
        }

        .page-title {
            margin-bottom: 24px;
        }

        .page-title h1 {
            font-size: 28px;
            margin-bottom: 7px;
        }

        .page-title p {
            color: #64748b;
        }

        .cards {
            display: grid;
            grid-template-columns: repeat(4, minmax(180px, 1fr));
            gap: 20px;
        }

        .card {
            background: #ffffff;
            border-radius: 10px;
            padding: 22px;
            box-shadow: 0 2px 8px rgba(15, 23, 42, 0.07);
        }

        .card-label {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 12px;
        }

        .card-value {
            font-size: 30px;
            font-weight: 700;
            color: #0f172a;
        }

        .welcome {
            background: linear-gradient(135deg, #0f766e, #115e59);
            color: #ffffff;
            padding: 26px;
            border-radius: 10px;
            margin-bottom: 24px;
        }

        .welcome h2 {
            margin-bottom: 9px;
        }

        @media (max-width: 950px) {
            .cards {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 650px) {
            .sidebar {
                display: none;
            }

            .content {
                padding: 20px;
            }

            .cards {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>
    <header class="header">
        <div class="brand">CivilPro</div>

        <div class="user-area">
            <span><?= esc($user->username ?? 'User') ?></span>
            <a class="logout" href="<?= site_url('logout') ?>">Logout</a>
        </div>
    </header>

    <div class="layout">
        <aside class="sidebar">
            <a href="<?= site_url('dashboard') ?>" class="active">Dashboard</a>
            <a href="#">Projects</a>
            <a href="#">Site Operations</a>
            <a href="#">Labour</a>
            <a href="#">Materials</a>
            <a href="#">Expenses</a>
            <a href="#">Reports</a>
            <a href="#">Administration</a>
        </aside>

        <main class="content">
            <div class="page-title">
                <h1>Dashboard</h1>
                <p>Civil site operations and project-cost overview</p>
            </div>

            <section class="welcome">
                <h2>Welcome, <?= esc($user->first_name ?? $user->username ?? 'Administrator') ?></h2>
                <p>You have successfully logged in to the CivilPro management system.</p>
            </section>

            <section class="cards">
                <div class="card">
                    <div class="card-label">Active Projects</div>
                    <div class="card-value">0</div>
                </div>

                <div class="card">
                    <div class="card-label">Today's Labour</div>
                    <div class="card-value">0</div>
                </div>

                <div class="card">
                    <div class="card-label">Material Requests</div>
                    <div class="card-value">0</div>
                </div>

                <div class="card">
                    <div class="card-label">Pending Approvals</div>
                    <div class="card-value">0</div>
                </div>
            </section>
        </main>
    </div>
</body>
</html>