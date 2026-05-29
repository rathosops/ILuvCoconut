use clap::{Parser, Subcommand};
use coconut_vision::{crop_symbols, detect_symbols, BackgroundMode, CropSymbolsRequest, DetectSymbolsRequest};

#[derive(Debug, Parser)]
#[command(name = "coconut-vision")]
#[command(about = "Detect slot symbols in composite raster assets.")]
struct Args {
    #[command(subcommand)]
    command: Command,
}

#[derive(Debug, Subcommand)]
enum Command {
    Detect {
        input_path: String,
        #[arg(long, default_value_t = 54)]
        threshold: u8,
        #[arg(long, default_value_t = 1400)]
        min_area: u32,
        #[arg(long, default_value_t = 12)]
        padding: u32,
        #[arg(long, default_value_t = 2_000_000)]
        max_analysis_pixels: u32,
    },
    Crop {
        input_path: String,
        output_dir: String,
        name_prefix: String,
        #[arg(long, default_value_t = 54)]
        threshold: u8,
        #[arg(long, default_value_t = 1400)]
        min_area: u32,
        #[arg(long, default_value_t = 12)]
        padding: u32,
        #[arg(long, default_value_t = 2_000_000)]
        max_analysis_pixels: u32,
    },
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = Args::parse();

    match args.command {
        Command::Detect {
            input_path,
            threshold,
            min_area,
            padding,
            max_analysis_pixels,
        } => {
            let response = detect_symbols(&DetectSymbolsRequest {
                input_path,
                threshold,
                min_area,
                padding,
                max_analysis_pixels,
                background_mode: BackgroundMode::Auto,
            })?;
            println!("{}", serde_json::to_string_pretty(&response)?);
        }
        Command::Crop {
            input_path,
            output_dir,
            name_prefix,
            threshold,
            min_area,
            padding,
            max_analysis_pixels,
        } => {
            let response = crop_symbols(&CropSymbolsRequest {
                input_path,
                output_dir,
                name_prefix,
                threshold,
                min_area,
                padding,
                max_analysis_pixels,
                background_mode: BackgroundMode::Auto,
            })?;
            println!("{}", serde_json::to_string_pretty(&response)?);
        }
    }

    Ok(())
}
