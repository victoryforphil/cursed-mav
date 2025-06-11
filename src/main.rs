use anyhow::Result;
use clap::Parser;
use log::{debug, info};

/// A CLI application to connect to a mavlink/ardupilot connection via URL
#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// The URL to connect to (e.g. tcp://localhost:5760)
    #[arg(short, long)]
    url: String,
}

fn main() -> Result<()> {
    // Initialize logging from RUST_LOG env var, defaulting to DEBUG
    if std::env::var("RUST_LOG").is_err() {
        std::env::set_var("RUST_LOG", "debug");
    }
    pretty_env_logger::init();

    // Parse command line arguments
    let args = Args::parse();
    
    debug!("Starting cmav_bridge with URL: {}", args.url);
    info!("Initializing MAVLink connection...");

    // TODO: Implement MAVLink connection logic
    
    Ok(())
} 