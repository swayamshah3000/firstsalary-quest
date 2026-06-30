use tauri_plugin_sql::{Migration, MigrationKind};

// FirstSalary Quest is an educational simulator. The only backend responsibility
// is to host a local SQLite database for the player's simulated game state.
//
// The schema lives in src/lib/db/schema.sql (the frontend tree) so the SQL is a
// single source of truth shared between the docs/types and this migration.
const SCHEMA_V1: &str = include_str!("../../src/lib/db/schema.sql");

// The connection string the frontend opens via @tauri-apps/plugin-sql.
// Keep this in sync with DB_URL in src/lib/db/index.ts.
const DB_URL: &str = "sqlite:firstsalary.db";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_initial_schema",
        sql: SCHEMA_V1,
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DB_URL, migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running FirstSalary Quest");
}
