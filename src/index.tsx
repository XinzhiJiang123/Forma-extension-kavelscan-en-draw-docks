import {render} from 'preact';
import './style.css';
import {Forma} from "forma-embedded-view-sdk/auto";
import {useState, useEffect} from "preact/hooks";
import './assets/styling.css';
import { FeatureCollection, Feature, Polygon, LineString } from "geojson";
import { Transform } from 'forma-embedded-view-sdk/render';

const DEFAULT_COLOR = {
    r: 0,
    g: 255,
    b: 255,
    a: 1.0,
};

type Point = { x: number; y: number };

function calculateDistance(point1: Point, point2: Point): number {
    return Math.sqrt(
        Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
}

function findPointsOnLine_1stPt(line: { coordinates: [Point, Point] }, spacing: number, dockWidth: number): Point[] {
    const start = line.coordinates[0];
    const end = line.coordinates[1];
    const totalLength = calculateDistance(start, end);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    const unitVector = { x: dx / lineLength, y: dy / lineLength };

    const points: Point[] = [];
    let currentDistance = spacing - dockWidth / 2;
    while (currentDistance + dockWidth < totalLength) {
        const newPoint = {
            x: start.x + unitVector.x * currentDistance,
            y: start.y + unitVector.y * currentDistance,
        };
        points.push(newPoint);
        currentDistance += spacing;
    }

    return points;
}

function findPointsOnLine_2ndPt(line: { coordinates: [Point, Point] }, spacing: number, dockWidth: number): Point[] {
    const start = line.coordinates[0];
    const end = line.coordinates[1];
    const totalLength = calculateDistance(start, end);

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const lineLength = Math.sqrt(dx * dx + dy * dy);
    const unitVector = { x: dx / lineLength, y: dy / lineLength };

    const points: Point[] = [];
    let currentDistance = spacing + dockWidth / 2;
    while (currentDistance < totalLength) {
        const newPoint = {
            x: start.x + unitVector.x * currentDistance,
            y: start.y + unitVector.y * currentDistance,
        };
        points.push(newPoint);
        currentDistance += spacing;
    }

    return points;
}


function App() {
    const [buildingPaths, setBuildingPaths] = useState<string[]>([]);

	const [kavelArea, setKavelArea] = useState<number | null>(null);
	const [bouwvlakArea, setBouwvlakArea] = useState<number | null>(null);

	const [minBebouwingspercentage, setMinBebouwingspercentage] = useState<number>(0);
	const [maxBebouwingspercentage, setMaxBebouwingspercentage] = useState<number>(0.6);
	const [parkeernormKantoor, setParkeernormKantoor] = useState<number>(2.3);
	const [parkeernormHal, setParkeernormHal] = useState<number>(0.9);
	const [oppervlakKantoor, setOppervlakKantoor] = useState<number>(500); 
	const [aantalBouwlagenKantoor, setaantalBouwlagenKantoor] = useState<number>(2); 
	const [halFunctie, setHalFunctie] = useState<string>("nvt");
	const [parkeerplaatsBenodigd, setParkeerplaatsBenodigd] = useState<number>(0);
	const [maxHalOppervlak, setMaxHalOppervlak] = useState<number | null>(null);

	const [isCollapsibleOpen, setIsCollapsibleOpen] = useState<boolean>(false);  // State to handle collapsible
	const [minHalOpp, setMinHalOpp] = useState<number>(0);  // State for the new input field

	const [dockDistance, setDockDistance] = useState<number | null>(4.7);
	const [dockWidth, setDockWidth] = useState<number | null>(3.5);
	const [dockHeight, setDockHeight] = useState<number | null>(4);
	const [dockLineLength, setDockLineLength] = useState<number | null>(null);
	const [dockLine_startX, setDockLine_startX] = useState<number | null>(null);
	const [dockLine_startY, setDockLine_startY] = useState<number | null>(null);
	const [dockLine_startZ, setDockLine_startZ] = useState<number | null>(null);
	const [dockLine_endX, setDockLine_endX] = useState<number | null>(null);
	const [dockLine_endY, setDockLine_endY] = useState<number | null>(null);
	const [dockLine_endZ, setDockLine_endZ] = useState<number | null>(null);
	const [dockAantal, setDockAantal] = useState<number | null>(null);
	

	const toggleCollapsible = () => {
		setIsCollapsibleOpen(!isCollapsibleOpen);
	  };



    useEffect(() => {
        const fetchData = async () => {
            Forma.geometry
                .getPathsByCategory({category: "building"})
                .then(setBuildingPaths);
        };
        fetchData();
    }, []);

	
	useEffect(() => {
	const button = document.getElementById('get_kavel_info_btn');
		if (button) {
			// Add event listener for button clicks
			button.addEventListener('click', async () => {
				console.log(`get_kavel_info_btn clicked`);

				// Get the clicked polygon
				const polygon = await Forma.designTool.getPolygon();
				if (!polygon || polygon.length === 0) return;

				console.log(`polygon: ${polygon},  ${polygon[0]}, ${polygon[0].x}, ${polygon[1].x}`);

				// find area of polygon kavel
				const n = polygon.length;
				let area = 0;
				for (let i = 0; i < n; i++) {
					const j = (i + 1) % n; // The next vertex index, wrapping around
					area += polygon[i].x * polygon[j].y;
					area -= polygon[i].y * polygon[j].x;
				}
				let kavel_area = Math.round(Math.abs(area / 2));
				console.log(`kavel_area: ${kavel_area}`);

				// Update the state to display the calculated area in the UI
				setKavelArea(kavel_area);

				// Find the smallest x- and y-coordinate
				const minX = Math.min(...polygon.map(point => point.x));
				const maxX = Math.max(...polygon.map(point => point.x));
				console.log(`Smallest x-coordinate: ${minX}`);
				const minY = Math.min(...polygon.map(point => point.y));
				const maxY = Math.max(...polygon.map(point => point.y));
				console.log(`Smallest y-coordinate: ${minY}`);
			});
		}
	
		return () => {
		  if (button) {
			button.removeEventListener('click', () => {});
		  }
		};
	  }, []);


	useEffect(() => {
	const button = document.getElementById('get_bouwvlak_info_btn');
		if (button) {
			// Add event listener for button clicks
			button.addEventListener('click', async () => {
				console.log(`get_bouwvlak_info_btn clicked`);

				// Get the clicked polygon
				const polygon = await Forma.designTool.getPolygon();
				if (!polygon || polygon.length === 0) return;

				console.log(`polygon: ${polygon},  ${polygon[0]}, ${polygon[0].x}, ${polygon[1].x}`);

				// find area of polygon kavel
				const n = polygon.length;
				let area = 0;
				for (let i = 0; i < n; i++) {
					const j = (i + 1) % n; // The next vertex index, wrapping around
					area += polygon[i].x * polygon[j].y;
					area -= polygon[i].y * polygon[j].x;
				}
				let kavel_area = Math.round(Math.abs(area / 2));
				console.log(`kavel_area: ${kavel_area}`);

				// Update the state to display the calculated area in the UI
				setBouwvlakArea(kavel_area);

				// Find the smallest x- and y-coordinate
				const minX = Math.min(...polygon.map(point => point.x));
				const maxX = Math.max(...polygon.map(point => point.x));
				console.log(`Smallest x-coordinate: ${minX}`);
				const minY = Math.min(...polygon.map(point => point.y));
				const maxY = Math.max(...polygon.map(point => point.y));
				console.log(`Smallest y-coordinate: ${minY}`);
			});
		}
	
		return () => {
			if (button) {
			button.removeEventListener('click', () => {});
			}
		};
		}, []);

				// // Calculate the center and dimensions of the polygon
				// const polygonCenterX = (minX + maxX) / 2;
				// const polygonCenterY = (minY + maxY) / 2;
				// const polygonWidth = maxX - minX;
				// const polygonHeight = maxY - minY;

				// // Draw the polygon in all contexts
				// for (const context of contexts) {
				// 	// Calculate the center and dimensions of the canvas
				// 	const canvasCenterX = context.canvas.width / 2;
				// 	const canvasCenterY = context.canvas.height / 2;
				// 	const canvasWidth = context.canvas.width;
				// 	const canvasHeight = context.canvas.height;
					

				// 	// Calculate the scale factor
				// 	const scaleX = canvasWidth / polygonWidth;
				// 	const scaleY = canvasHeight / polygonHeight;
				// 	const scale = Math.min(scaleX, scaleY);

				// 	// Translate and scale the context
				// 	context.translate(canvasCenterX - polygonCenterX * scale, canvasCenterY - polygonCenterY * scale);
				// 	context.scale(scale, scale);
					
				// 	// Start a new path for the polygon
				// 	context.beginPath();

				// 	// Move to the first point of the polygon
				// 	context.moveTo(minX, minY);

				// 	// Draw lines to the rest of the points
				// 	for (let i = 1; i < polygon.length; i++) {
				// 		context.lineTo(polygon[i].x, polygon[i].y);
				// 	}
				// 	// Draw a line back to the first point
				// 	context.lineTo(polygon[0].x, polygon[0].y);

				// 	// Close the path and stroke the polygon
				// 	context.closePath();
				// 	context.strokeStyle = 'black';
				// 	context.stroke();
				// }
		// 	});
		// }
	

	// Function to update calculations based on input values
	useEffect(() => {
		let parkeerplaatsBenodigdCalculation = 0;
	
		// // Calculate "Parkeerplaats benodigd"
		// if (halFunctie === "intensief") {
		// 	parkeerplaatsBenodigdCalculation = parkeernormKantoor * oppervlakKantoor + 100;
		// } else {
		// 	parkeerplaatsBenodigdCalculation = parkeernormKantoor * oppervlakKantoor + 10;
		// }
		// setParkeerplaatsBenodigd(parkeerplaatsBenodigdCalculation);
	
		// Calculate "Max. hal oppervlak"
		if (kavelArea !== null) {
			// setMaxHalOppervlak(kavelArea - parkeerplaatsBenodigdCalculation * 25);
			let bebouwd_opp_kantoor = oppervlakKantoor / aantalBouwlagenKantoor;
			let aantal_benodigde_parkeerplaatsen = parkeernormKantoor * oppervlakKantoor / 100;
			let opp_parkeren_kantoor = aantal_benodigde_parkeerplaatsen * 25;

			// let Beperkt door max. bebouwingsperc. =('Kavel optimaliseren'!C11/100 - B2/'Kavel optimaliseren'!C6) * 'Kavel optimaliseren'!C6
			let maxHalOppervlak_Beperkt_door_bouwvlak = bouwvlakArea - bebouwd_opp_kantoor;
			let maxHalOppervlak_Beperkt_door_max_bebouwingsperc = (maxBebouwingspercentage - bebouwd_opp_kantoor / kavelArea) * kavelArea;
			let maxHalOppervlak_Beperkt_door_totaal_benodigd_opp = kavelArea - bebouwd_opp_kantoor - opp_parkeren_kantoor + parkeernormHal / 100; // =('Kavel optimaliseren'!C6-B2-B4)/1+'Kavel optimaliseren'!C9/100 + 0.15247
			const minValue = Math.min(maxHalOppervlak_Beperkt_door_bouwvlak, maxHalOppervlak_Beperkt_door_max_bebouwingsperc, maxHalOppervlak_Beperkt_door_totaal_benodigd_opp);
			console.log(`minValue: ${maxHalOppervlak_Beperkt_door_bouwvlak }, ${maxHalOppervlak_Beperkt_door_max_bebouwingsperc}, ${maxHalOppervlak_Beperkt_door_totaal_benodigd_opp}`);
			setMaxHalOppervlak(minValue);

			parkeerplaatsBenodigdCalculation = minValue * parkeernormHal / 100 + aantal_benodigde_parkeerplaatsen;
			setParkeerplaatsBenodigd(parkeerplaatsBenodigdCalculation);
		}
		}, [parkeernormKantoor, oppervlakKantoor, halFunctie, kavelArea, bouwvlakArea, maxBebouwingspercentage, parkeernormHal, aantalBouwlagenKantoor]);

	
	////////////////////////
	////// Draw docks //////	
	////////////////////////
	// first get the line on which docks should be created
	useEffect(() => {
		const button = document.getElementById('get_line_for_docks_btn');
			if (button) {
				// Add event listener for button clicks
				button.addEventListener('click', async () => {
					console.log(`get_line_for_docks_btn clicked`);
	
					// Get the clicked line
					const line = await Forma.designTool.getLine();
					if (!line) return;
	
					console.log(`line: ${line},  ${line.coordinates}, 
						${line.coordinates[0].x}, ${line.coordinates[1].x}, ${line.coordinates[0].y}, ${line.coordinates[1].y}, ${line.coordinates[0].z}, ${line.coordinates[1].z}`);
	
					// find length of selected line
					let line_length = Math.sqrt(
						Math.pow(line.coordinates[1].x - line.coordinates[0].x, 2) +
						Math.pow(line.coordinates[1].y - line.coordinates[0].y, 2)
					);
					console.log(`line_length: ${line_length}`);
	
					// Update the state to display the calculated area in the UI
					setDockLineLength(line_length);
					setDockAantal(Math.floor(line_length / dockDistance));
					setDockLine_startX(line.coordinates[0].x);
					setDockLine_startY(line.coordinates[0].y);
					setDockLine_startZ(line.coordinates[0].z);
					setDockLine_endX(line.coordinates[1].x);
					setDockLine_endY(line.coordinates[1].y);
					setDockLine_endZ(line.coordinates[1].z);
				});
			}
			return () => {
			  if (button) {
				button.removeEventListener('click', () => {});
			  }
			};
		  }, []);

	


	///////////////////////////////////////////////////////
	const renderRectangle = async () => {
        // Define the coordinates for the rectangle
        const xMin = -50;
        const yMin = -50;
        const xMax = 50;
        const yMax = 50;
		console.log(`dockLineLength: ${dockLineLength}`);
		const line = {
			coordinates: [
				{ x: dockLine_startX, y: dockLine_startY }, // Start point
				{ x: dockLine_endX, y: dockLine_endY } // End point
			] as [Point, Point] // Explicitly define as a tuple
		};
		const spacing = dockDistance;

		const pointsOnLine_1stPt = findPointsOnLine_1stPt(line, spacing, dockWidth);
		const pointsOnLine_2ndPt = findPointsOnLine_2ndPt(line, spacing, dockWidth);
        console.log("Points on line:", pointsOnLine_1stPt, pointsOnLine_2ndPt);

		// Ensure both arrays have the same length before proceeding
		const lineFeatures1 = pointsOnLine_1stPt.map((startPt, i) => {
			const endPt = pointsOnLine_2ndPt[i];
			return {
				type: "Feature" as const,
				properties: {},
				geometry: {
					type: "LineString" as const,
					coordinates: [
						[startPt.x, startPt.y, dockLine_startZ],
						[startPt.x, startPt.y, dockLine_startZ + dockHeight],
					],
				},
			};
		});
		const lineFeatures2 = pointsOnLine_1stPt.map((startPt, i) => {
			const endPt = pointsOnLine_2ndPt[i];
			return {
				type: "Feature" as const,
				properties: {},
				geometry: {
					type: "LineString" as const,
					coordinates: [
						[startPt.x, startPt.y, dockLine_startZ + dockHeight],
						[endPt.x, endPt.y, dockLine_startZ + dockHeight],
					],
				},
			};
		});
		// Apply a transformation to move the lines up by 4 meters
		const transform: Transform = [
			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 4, 1 // Translation on z-axis by 4 meters
		];
		// // Create the GeoJSON object for the series of lines
		// const geojson: FeatureCollection<LineString> = {
		// 	type: "FeatureCollection",
		// 	features: [...lineFeatures1, ...lineFeatures2],
		// };
		// Create the GeoJSON object for the rectangle
        // Create the GeoJSON object for the rectangle
        const geojson: FeatureCollection<Polygon> = {
            type: "FeatureCollection",
            features: [
                {
                    type: "Feature",
                    properties: {},
                    geometry: {
                        type: "Polygon",
                        coordinates: [
                            [
                                [0, 0, 0],
                                [10, 0, 0],
                                [10, 22, 0],
                                [0, 22, 0],
                                [0, 0, 0] // Closing the loop
                            ]
                        ],
                    },
                },
            ],
        };
		// Use Forma API to add the geojson with the transform
		Forma.render.geojson.add({
			geojson,
			transform,
		}).then(({ id }) => {
			console.log("Generated GeoJSON with ID:", id);
		}).catch(error => {
			console.error("Error rendering geojson:", error);
		});

        // // Use Forma API to add the rectangle to the 3D scene
        // try {
        //     const { id } = await Forma.render.geojson.add({ geojson, transform, });
        //     console.log("Rectangle rendered with ID:", id);
        // } catch (error) {
        //     console.error("Error rendering rectangle:", error);
        // }


		// Define the positions for the vertices of the mesh (flattened x, y, z coordinates)
		console.log(`dockLine_startX: ${dockLine_startX}, dockLine_startY: ${dockLine_startY}, dockLine_startZ: ${dockLine_startZ}`);
		console.log(`dockLine_endX: ${dockLine_endX}, dockLine_endY: ${dockLine_endY}, dockLine_endZ: ${dockLine_endZ}`);
		const positions = new Float32Array([
			dockLine_startX, dockLine_startY, dockLine_startZ,   // Vertex 0
			dockLine_startX, dockLine_startY, dockLine_startZ + 10,  // Vertex 1
			dockLine_endX, dockLine_endY, dockLine_startZ + 10, // Vertex 2
			dockLine_endX, dockLine_endY, dockLine_startZ,   // Vertex 3
			// dockLine_startX, dockLine_startY, dockLine_startZ, 
		]);

		// Define the indices that form two triangles making up the rectangle
		const indices = [
			0, 1, 2, // First triangle
			0, 2, 3  // Second triangle
		];

		// // Optional: Define normals (for lighting/shading calculations)
		// const normals = new Float32Array([
		// 	0, 0, 1,  // Normal for Vertex 0
		// 	0, 0, 1,  // Normal for Vertex 1
		// 	0, 0, 1,  // Normal for Vertex 2
		// 	0, 0, 1   // Normal for Vertex 3
		// ]);

		// Optional: Define colors for each vertex as r,g,b,a values (0-255 range)
		const colors = new Uint8Array([
			255, 0, 0, 255,  // Red for Vertex 0
			0, 255, 0, 255,  // Green for Vertex 1
			0, 0, 255, 255,  // Blue for Vertex 2
			255, 255, 0, 255 // Yellow for Vertex 3
		]);

		// Define the GeometryData object
		const geometryData = {
			position: positions,
			index: indices,
			// normal: normals,
			color: colors
		};

		// Define the transformation matrix to apply
		const transform2: Transform = [
			1, 0, 0, 0,  // X-axis scaling, rotation, and translation
			0, 1, 0, 0,  // Y-axis scaling, rotation, and translation
			0, 0, 1, 0,  // Z-axis scaling, rotation, and translation
			0, 0, 4, 1   // Translation on Z-axis (tx, ty, tz, 1)
		];

		// Use Forma API to add the mesh with the transform
		Forma.render.addMesh({
			geometryData,
			// transform2,
		}).then(({ id }) => {
			console.log("Generated Mesh with ID:", id);
		}).catch(error => {
			console.error("Error rendering mesh:", error);
		});
    };




	const removeAllGeojsons = async () => {
        // Use Forma API to remove all GeoJSONs from the scene
        try {
            await Forma.render.cleanup();
            console.log("All GeoJSONs have been removed.");
        } catch (error) {
            console.error("Error removing GeoJSONs:", error);
        }
    };





    return (
        <>
            <div class="section" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0', margin: '0' }}>
				{/* <h3 style={{backgroundColor: 'rgba(16, 59, 126, 0.9)', width: '100%', color: 'white'}}>
					Selecteer jouw kavel
				</h3> */}
				<h2 style={{marginBottom: '20px', marginTop: '0px' }}>
					Tool 1: kavelscan
				</h2>

				<button id="get_kavel_info_btn" class="selecteer_btn">
					<b>Selecteer jouw kavel</b>
					</button>
				<p class="text_showing_info_of_selected" >
					Kavel oppervlak [m2]: {kavelArea !== null ? kavelArea : " --"}
				</p>

				<button id="get_bouwvlak_info_btn" class="selecteer_btn">
					<b>Selecteer jouw bouwvlak</b>
					</button>
				<p class="text_showing_info_of_selected">
					Bouwvlak oppervlak [m2]: {bouwvlakArea !== null ? bouwvlakArea : " --"}
				</p>


				{/* <br></br> */}
				{/* <h3 style={{backgroundColor: 'rgba(16, 59, 126, 0.8)', width: '100%', color: 'white', margin: '0px'}}>
					Vul kavel eigenschappen in
				</h3> */}

				<div  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', 
					padding: '0', margin: '0', border: '1px solid', backgroundColor: 'rgba(36, 79, 166, 0.1)', }}>
					
					<p style={{backgroundColor: 'rgba(16, 59, 126, 0.7)', width: '100%', color: 'white', margin: '0px'}}>
						<b>Kavel gegevens</b>
					</p>
					
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',  }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Min. bebouwingspercentage:
						</label>
						<input
							type="number"
							step="0.01"
							value={minBebouwingspercentage}
							onChange={(e) => setMinBebouwingspercentage(parseInt((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',  }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Max. bebouwingspercentage:
						</label>
						<input
							type="number"
							step="0.01"
							value={maxBebouwingspercentage}
							onChange={(e) => setMaxBebouwingspercentage(parseInt((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Parkeernorm kantoor (double):
						</label>
						<input
							type="number"
							step="0.01"
							value={parkeernormKantoor}
							onChange={(e) => setParkeernormKantoor(parseFloat((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}  // Set a width for the input
						/>
					</div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Parkeernorm hal (double):
						</label>
						<input
							type="number"
							step="0.01"
							value={parkeernormHal}
							onChange={(e) => setParkeernormHal(parseFloat((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}  // Set a width for the input
						/>
						
					</div>

					<p style={{backgroundColor: 'rgba(16, 59, 126, 0.7)', width: '100%', color: 'white', margin: '0px'}}>
						<b>Kantoor gegevens</b>
					</p>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Oppervlak kantoor (integer):
						</label>
						<input
							type="number"
							value={oppervlakKantoor}
							onChange={(e) => setOppervlakKantoor(parseInt((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Aantal bouwlagen (integer):
						</label>
						<input
							type="number"
							value={aantalBouwlagenKantoor}
							onChange={(e) => setOppervlakKantoor(parseInt((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>

					{/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Hal functie:
						</label>
						<select value={halFunctie} onChange={(e) => setHalFunctie((e.target as HTMLSelectElement).value)} 
						style={{ width: '100px', textAlign: 'right', margin: '10px' }}>
							<option value="intensief">Intensief</option>
							<option value="extensief">Extensief</option>
							<option value="nvt">Nvt</option>
							
						</select>
					</div> */}
				</div>


				<br></br>
				<h3 style={{backgroundColor: 'rgba(16, 59, 126, 0.9)', width: '100%', color: 'white', marginBottom: '0px'}}>
					Resultaat: <br></br> geoptimaliseerd kavelgebruik
				</h3>

				<div  style={{ backgroundColor: '#e0ebf9', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '10px', margin: '0',  }}>	
				
					<p>Parkeerplaats benodigd: {parkeerplaatsBenodigd}</p>
					<p><b>Max. hal oppervlak [m2]: {maxHalOppervlak !== null ? maxHalOppervlak : "--"}</b></p>
				
				</div>

				

				<br></br>
				<br></br>

				<h2 style={{marginBottom: '0px' }}>
					Tool 2: dock plaatsen
				</h2>
				<p>Teken automatisch rechthoekige docks langs een geselecteerd lijn, <br></br>zodat artist impression tools docks kan herkennen.</p>
				<br></br>
				<button class="selecteer_orange_btn" id="get_line_for_docks_btn">
					<b>Selecteer een line on which to draw docks</b>
				</button>
				<p class="text_showing_info_of_selected" >
					Lengte geselecteerd lijn [m]: {dockLineLength !== null ? dockLineLength : " --"}
				</p>
				{/* <br></br> */}

				<div  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0', margin: '0', border: '1px solid' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',  }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Afstand tussen docks (center-to-center):
						</label>
						<input
							type="number"
							step="0.1"
							value={dockDistance}
							onChange={(e) => setDockDistance(parseInt((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',  }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Dock breedte:
						</label>
						<input
							type="number"
							step="0.1"
							value={dockWidth}
							onChange={(e) => setDockWidth(parseInt((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',  }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Dock hoogte:
						</label>
						<input
							type="number"
							step="0.1"
							value={dockHeight}
							onChange={(e) => setDockHeight(parseInt((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>
				</div>
				<p class="text_showing_info_of_selected" >
					Aantal docks that can be placed on the line: {dockAantal !== null ? dockAantal : " --"}
				</p>


				{/* <br></br> */}
				<button class="selecteer_orange_btn" onClick={renderRectangle}>
					Plaats docks
				</button>
				<br></br>
				<button class="remove_docks_btn" onClick={removeAllGeojsons}>
					Verwijder alle docks
				</button>

				<br></br>
				<br></br>
				<br></br>
				<br></br>

				<h3 style={{backgroundColor: 'rgba(19, 41, 75, 0.8)', width: '100%', color: 'white'}}>
					4. (optioneel) Genereer gebouw opties
				</h3>
				
				
				{/* Collapsible Section for klantwensen before generating opties*/}
				<div style={{ width: '100%', marginTop: '20px' }}>
				
					{/* Collapsible Header */}
					<div
						onClick={toggleCollapsible}
						style={{
							cursor: 'pointer',
							backgroundColor: 'rgba(19, 41, 75, 0.1)',
							padding: '4px',
							borderRadius: '4px',
							textAlign: 'left',
							width: '100%',
						}}
					>
						Vul hier meer klantwensen in
					</div>
					{/* Collapsible Content */}
					{isCollapsibleOpen && (
						<div style={{ padding: '10px', backgroundColor: '#f9f9f9', marginTop: '10px', borderRadius: '4px' }}>
						<label>
							Jouw gewenste min. hal opp.:
							<input
							type="number"
							value={minHalOpp}
							onChange={(e) => setMinHalOpp(parseFloat((e.target as HTMLInputElement).value))}
							style={{ width: '100px', marginLeft: '10px' }}
							/>
						</label>
						</div>
					)}
				</div>
				{/* end of Collapsible Section for klantwensen before generating opties*/}


				{/* <p><b>Genereer opties</b></p> */}
				<div style={{ height: '10px'}}></div>
				<button ><b>Show een mogelijke optie in 3d <br></br>of <br></br>Ververs</b></button>

				<br></br>
				<div>
					<p><b>Details van deze optie: </b></p>
					<p>Parkeerplaats benodigd: {parkeerplaatsBenodigd}</p>
					<p>Hal oppervlak [m2]: {maxHalOppervlak !== null ? maxHalOppervlak : "--"}</p>
					<p>Kantoor oppervlak: 10000 m2</p>
					<p>Bebouwingspercentage: 60%</p>
				</div>

				


				


				<br></br>
				<br></br>
				<br></br>
				<br></br>
				<br></br>
				<p>Total number of buildings: {buildingPaths?.length}</p>
				<br></br>
				<br></br>
            </div>
        </>
    );
}

render(<App/>, document.getElementById('app'));
