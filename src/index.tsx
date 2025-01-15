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

function calculatePerimeterAndArea(xCoordinates: number[], yCoordinates: number[]) {
    const n = xCoordinates.length;

    if (n < 3) {
        throw new Error("A polygon must have at least 3 vertices.");
    }

    let perimeter = 0;
    let area = 0;

    // Iterate over each vertex and its next neighbor
    for (let i = 0; i < n; i++) {
        const nextIndex = (i + 1) % n; // Next vertex index (wraps around to the first vertex)

        // Coordinates of current and next vertex
        const x1 = xCoordinates[i], y1 = yCoordinates[i];
        const x2 = xCoordinates[nextIndex], y2 = yCoordinates[nextIndex];

        // Calculate distance for perimeter
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        perimeter += distance;

        // Add to the area using Shoelace formula
        area += x1 * y2 - y1 * x2;
    }

    // Finalize area calculation
    area = Math.abs(area) / 2;

    return { perimeter, area };
}


function App() {
    const [buildingPaths, setBuildingPaths] = useState<string[]>([]);

	const [kavelArea, setKavelArea] = useState<number | null>(null);
	const [bouwvlakArea, setBouwvlakArea] = useState<number | null>(null);

	const [minBebouwingspercentage, setMinBebouwingspercentage] = useState<number>(0);
	const [maxBebouwingspercentage, setMaxBebouwingspercentage] = useState<number>(0.7);
	const [parkeernormKantoor, setParkeernormKantoor] = useState<number>(2.3);
	const [parkeernormHal, setParkeernormHal] = useState<number>(0.9);
	const [oppervlakKantoor, setOppervlakKantoor] = useState<number>(500); 
	const [aantalBouwlagenKantoor, setaantalBouwlagenKantoor] = useState<number>(2); 
	const [halFunctie, setHalFunctie] = useState<string>("nvt");
	const [parkeerplaatsBenodigd, setParkeerplaatsBenodigd] = useState<number>();
	const [maxHalOppervlak, setMaxHalOppervlak] = useState<number | null>(null);


	// other results in kavelscan results
	const [bvoTotaal, setBvoTotaal] = useState<number | null>(null);
	const [bebouwdOpp, setBebouwdOpp] = useState<number | null>(null);
	const [restOpp, setRestOpp] = useState<number | null>(null);
	const [bebouwingsgraad, setBebouwingsgraad] = useState<number | null>(null);
	const [docks, setDocks] = useState<number | null>(null);
	

	const [geselecteerd_hal, setGeselecteerd_hal] = useState<string>("niks");
	const [geselecteerd_kan, setGeselecteerd_kan] = useState<string>("niks");
	const [dockAantalForExport, setDockAantalForExport] = useState<number | null>(10);
	const [halKanOverlapLength, setHalKanOverlapLength] = useState<number | null>(40);
	const [halCompartLength, setHalCompartLength] = useState<number | null>(300);
	const [mezOpp, setMezOpp] = useState<number | null>(0);


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

	// so that values of elements selected can be stored and exported to json
	const [buildingData_hal, setBuildingData_hal] = useState<{ 
		a_bvo_hal: number; 
		l_perim_hal_total: number;
		a_facade_hal: number;  
		a_hal_gevel: number; 
		c_hal_z: number;
	}>({
		a_bvo_hal: 0,
		l_perim_hal_total: 0,
		a_facade_hal: 0,
		a_hal_gevel: 0,
		c_hal_z: 0,
	  });
	const [buildingData_kan, setBuildingData_kan] = useState<{ 
		a_kan_1floor: number; nfloor_kan: number; l_perim_kan_total: number; 
		a_bvo_kan: number; 
		a_facade_kan: number;  
		a_kan_gevel: number; 
		c_kan1_z: number;
	}>({a_kan_1floor: 0, nfloor_kan: 0, l_perim_kan_total: 0,
		a_bvo_kan: 0,
		a_facade_kan: 0,  
		a_kan_gevel: 0, 
		c_kan1_z: 0,
	});
	// // [a_bvo, a_bvo_hal, a_hal_mez, a_kan_1floor, nfloor_kan, a_bvo_kan, a_total_for_fund]
	const [a_bvo_list, set_a_bvo_list] = useState<{
		 a_bvo: number; a_bvo_hal: number; 
		 a_hal_mez: number; a_kan_1floor: number; 
		 nfloor_kan: number; a_bvo_kan: number;
		 a_total_for_fund: number;
		} | null>(null);
	// set_a_bvo_list({ a_bvo_hal: Math.round(area), perimeter: Math.round(perimeter) });
	// //[a_dak_hal, a_dak_kan] = a_dak
	const [a_dak, set_a_dak] = useState<{
		a_dak_hal: number; a_dak_kan: number; 
	   } | null>(null);
	// set_a_dak({ a_bvo_hal: Math.round(area), perimeter: Math.round(perimeter) });
	// // [l_perim_hal_total, l_perim_kan_total, l_perim_halkan_overlap, a_facade_hal, a_facade_kan, a_hal_gevel, a_kan_gevel] = a_gevel
	const [a_gevel, set_a_gevel] = useState<{
		l_perim_hal_total: number; l_perim_kan_total: number; 
		l_perim_halkan_overlap: number; 
		a_facade_hal: number; 
		a_facade_kan: number; 
		a_hal_gevel: number;
		a_kan_gevel: number;
	   } | null>(null);
	// set_a_gevel({ a_bvo_hal: Math.round(area), perimeter: Math.round(perimeter) });
	// // ...
	// set_l_perim_kavel({ a_bvo_hal: Math.round(area), perimeter: Math.round(perimeter) });
	// set_c_hal_z({ c_hal_z: Math.round(height * 100) / 100 });  // round to 2 decimals
	const [c_hal_z, set_c_hal_z] = useState<{
		c_hal_z: number;
	   } | null>(null);
	const [c_kan1_z, set_c_kan1_z] = useState<{
		c_kan1_z: number;
	   } | null>(null);




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
			const minValue = Math.round(Math.min(maxHalOppervlak_Beperkt_door_bouwvlak, maxHalOppervlak_Beperkt_door_max_bebouwingsperc, maxHalOppervlak_Beperkt_door_totaal_benodigd_opp));
			console.log(`minValue: ${maxHalOppervlak_Beperkt_door_bouwvlak }, ${maxHalOppervlak_Beperkt_door_max_bebouwingsperc}, ${maxHalOppervlak_Beperkt_door_totaal_benodigd_opp}`);
			
			// set the output values
			setMaxHalOppervlak(minValue);
			setBvoTotaal(minValue + oppervlakKantoor);
			setBebouwdOpp(minValue + bebouwd_opp_kantoor);
			setRestOpp(kavelArea - (minValue + bebouwd_opp_kantoor));
			setBebouwingsgraad((minValue + bebouwd_opp_kantoor) / kavelArea);
			setDocks(Math.round(minValue / 850));


			parkeerplaatsBenodigdCalculation = Math.ceil(minValue * parkeernormHal / 100 + aantal_benodigde_parkeerplaatsen);
			setParkeerplaatsBenodigd(parkeerplaatsBenodigdCalculation);
		}
		}, [kavelArea, bouwvlakArea, minBebouwingspercentage, maxBebouwingspercentage, parkeernormKantoor, parkeernormHal, oppervlakKantoor, aantalBouwlagenKantoor]);

	
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



	// Download handler function
    const handleDownload = () => {
        // Create a dummy JSON object
        // const data = { message: "This is a dummy JSON file." };
		// Create the JSON object with the calculated data
		// [a_bvo, a_bvo_hal, a_hal_mez, a_kan_1floor, nfloor_kan, a_bvo_kan, a_total_for_fund]
        const data = {
            name: "interpolator",
            PvE: [
                {
                    name: "a_bvo_list",
                    value: [
						// +mez
						!buildingData_hal && !buildingData_kan && mezOpp == null
							? "No combined data"
							: (buildingData_hal?.a_bvo_hal ?? 0)
							+ (buildingData_kan?.a_bvo_kan ?? 0)
							+ (mezOpp ?? 0),
						buildingData_hal ? buildingData_hal.a_bvo_hal : "No hal data",
						mezOpp ?? 0,
						// mezOpp !== null && mezOpp !== undefined ? mezOpp : 0,
						buildingData_kan ? buildingData_kan.a_kan_1floor : 0,
						buildingData_kan ? buildingData_kan.nfloor_kan : 0,
						buildingData_kan ? buildingData_kan.a_bvo_kan : 0,
						buildingData_hal && buildingData_kan ? buildingData_hal.a_bvo_hal + buildingData_kan.a_kan_1floor : "No combined data",
					],
                },
				{
                    name: "a_dak",
                    value: [
						buildingData_hal ? buildingData_hal.a_bvo_hal : "No hal data",
						buildingData_kan ? buildingData_kan.a_kan_1floor : "No kan data",
					],
                },
				// [l_perim_hal_total, l_perim_kan_total, l_perim_halkan_overlap, a_facade_hal, a_facade_kan, a_hal_gevel, a_kan_gevel] = a_gevel
				{
                    name: "a_gevel",
                    value: [
						buildingData_hal ? buildingData_hal.l_perim_hal_total : "No hal data",
						buildingData_kan ? buildingData_kan.l_perim_kan_total : "No kan data",
						// l_perim_halkan_overlap
						halKanOverlapLength !== null && halKanOverlapLength !== undefined ? halKanOverlapLength : 0,
						// a_facade_hal 
						halKanOverlapLength !== null && halKanOverlapLength !== undefined ? buildingData_hal.l_perim_hal_total * buildingData_hal.c_hal_z - 
						halKanOverlapLength * Math.min(buildingData_kan.c_kan1_z, buildingData_hal.c_hal_z) : "No overlap data",
						// a_gevel_kan
						buildingData_kan && halKanOverlapLength !== null && halKanOverlapLength !== undefined ? buildingData_kan.a_kan_gevel - 
						halKanOverlapLength * Math.min(buildingData_kan.c_kan1_z, buildingData_hal.c_hal_z) : "No kan data",
					],
                },
				{
                    name: "ndock",
                    value: 
					dockAantalForExport !== null && dockAantalForExport !== undefined ? dockAantalForExport : 0,
                },
				{
                    name: "a_laadkuil",
                    value: 
						dockAantalForExport !== null && dockAantalForExport !== undefined ? dockAantalForExport * 4.8 * 27 : 0,
                },
				{
                    name: "a_terrein",
                    value: 
					dockAantalForExport !== null && dockAantalForExport !== undefined ? buildingData_hal.a_bvo_hal + buildingData_kan.a_bvo_kan + dockAantalForExport * 4.8 * 27 : buildingData_hal.a_bvo_hal + buildingData_kan.a_bvo_kan,
                },
				{
                    name: "l_perim_kavel",
                    value: 
					dockAantalForExport !== null && dockAantalForExport !== undefined ? 
					Math.sqrt((buildingData_hal.a_bvo_hal + buildingData_kan.a_bvo_kan + dockAantalForExport * 4.8 * 27) / 6) * 10 : Math.sqrt((buildingData_hal.a_bvo_hal + buildingData_kan.a_bvo_kan) / 6) * 10,
                },
				{
                    name: "c_hal_z",
                    value: 
					buildingData_hal ? buildingData_hal.c_hal_z : "No hal data",
				},
				{
                    name: "c_kan_z",
                    value: 
					buildingData_kan ? buildingData_kan.c_kan1_z : "No kan data",
				},
				{
					name: "in_hal_compart_length_num",
					value: halCompartLength !== null && halCompartLength !== undefined ? halCompartLength : 0,
				},
				{
					name: "a_kan_compart",  // for buiten kan
					value: buildingData_kan && halKanOverlapLength !== null && halKanOverlapLength !== undefined ? 
					halKanOverlapLength * Math.min(buildingData_kan.c_kan1_z, buildingData_hal.c_hal_z) : "No kan data",
				},
            ],
        };

		// const a_bvo = 
		// const a_bvo_list = [a_bvo, a_bvo_hal, a_hal_mez, a_kan_1floor, nfloor_kan, a_bvo_kan, a_total_for_fund];

        // Convert the data to a JSON string
        const jsonString = JSON.stringify(data, null, 2); // Pretty-print with indentation

        // Create a Blob from the JSON string
        const blob = new Blob([jsonString], { type: 'application/json' });

        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);

        // Create a temporary <a> element
        const link = document.createElement('a');
        link.href = url;
        link.download = 'dummy.json';

        // Append the link to the document body and trigger the click
        document.body.appendChild(link);
        link.click();

        // Clean up by removing the link and revoking the object URL
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    // get hal from selection
	useEffect(() => {
		const button = document.getElementById('get_building_info_hal_btn');
			if (button) {
				// Add event listener for button clicks
				button.addEventListener('click', async () => {
					console.log(`get_building_info_hal_btn clicked`);

					try {
						// Fetch all paths to buildings in the current proposal.
						const buildingPaths = await Forma.geometry.getPathsByCategory({ category: "buildings" })
						console.log(`buildingPaths: ${buildingPaths}`);

						// Fetch all paths to selected elements in the current proposal.
						// Count how many of them are buildings.
						const selectedPaths = await Forma.selection.getSelection()
						// const buildingPaths2 = await Forma.geometry.getPathsByCategory({ category: "buildings" })
						// console.log(`buildingPaths2: ${buildingPaths2}`);
						const selectedBuildingPaths = selectedPaths.filter(path => buildingPaths.includes(path))
						const numberOfSelectedBuildings = selectedBuildingPaths.length
						console.log(`selectedBuildingPaths: ${selectedBuildingPaths}`);
						console.log(`numberOfSelectedBuildings: ${numberOfSelectedBuildings}`);
						console.log(`selectedPaths: ${selectedPaths}`);

						// Use getByPath() to retrieve elements for the filtered paths
						const elements = await Promise.all(
							selectedPaths.map(async (path) => {
								const { element, elements } = await Forma.elements.getByPath({ path });
								return { element, elements };
							})
						);
						console.log(`Retrieved elements:`, elements);

						// Navigate the structure and access coordinates
						// Initialize arrays to store x and y coordinates
						const xCoordinates: number[] = [];
						const yCoordinates: number[] = [];
						const floors = elements[0].element.representations.__INTERNAL__.data.floors[0].graph.vertices;
						// Loop through all vertices
						for (const vertexId in floors) {
							if (floors.hasOwnProperty(vertexId)) {
								const vertex = floors[vertexId];
								xCoordinates.push(vertex.x);
								yCoordinates.push(vertex.y);
							}
						}
						console.log('X Coordinates:', xCoordinates);
						console.log('Y Coordinates:', yCoordinates);

						// calculate the perimeter and area of the building
						const { perimeter, area } = calculatePerimeterAndArea(xCoordinates, yCoordinates);
						const height = elements[0].element.representations.__INTERNAL__.data.floors[0].height;
						console.log(`Perimeter: ${perimeter}`);
						console.log(`Area: ${area}`);
						console.log(`Height: ${height}`);

						// Update the state to display the calculated area in the UI
						setGeselecteerd_hal(`${Math.round(perimeter)} m perimeter, ${Math.round(area)} m2 oppervlak, ${Math.round(height)} m hoogte`);
						// [a_bvo, a_bvo_hal, a_hal_mez, a_kan_1floor, nfloor_kan, a_bvo_kan, a_total_for_fund]
						// const [buildingData_hal, setBuildingData_hal] = useState<{ 
						// 	a_bvo: number; l_perim_hal_total: number;
						// 	a_facade_hal: number;  
						// 	a_hal_gevel: number; 
						// 	c_hal_z: number;
						// } | null>(null);
						setBuildingData_hal({ 
							a_bvo_hal: Math.round(area), l_perim_hal_total: Math.round(perimeter),
							a_facade_hal: Math.round(perimeter * height),
							a_hal_gevel: Math.round(perimeter * height),
							c_hal_z: Math.round(height * 100) / 100, 
						});
					} catch (error) {
						console.error(`Error fetching building info:`, error);
					}
				});
			}
		
			return () => {
			  if (button) {
				button.removeEventListener('click', () => {});
			  }
			};
		}, []);

	// get kantoor from selection
	useEffect(() => {
		const button = document.getElementById('get_building_info_kan_btn');
			if (button) {
				// Add event listener for button clicks
				button.addEventListener('click', async () => {
					console.log(`get_building_info_kan_btn clicked`);

					try {
						// Fetch all paths to selected elements in the current proposal
						const selectedPaths = await Forma.selection.getSelection();
						console.log(`selectedPaths: ${selectedPaths}`);
		
						// Use getByPath() to retrieve elements for the filtered paths
						const elements = await Promise.all(
							selectedPaths.map(async (path) => {
								const { element, elements } = await Forma.elements.getByPath({ path });
								return { element, elements };
							})
						);
						console.log(`Retrieved elements:`, elements);
		
						// Navigate the structure and access all floors
						const floors = elements[0].element.representations.__INTERNAL__.data.floors;

						const height_total = 0;
		
						const floorMetrics = floors.map((floor: any, index: number) => {
							const vertices = floor.graph.vertices;
		
							// Extract x and y coordinates of all vertices
							const xCoordinates: number[] = [];
							const yCoordinates: number[] = [];
							for (const vertexId in vertices) {
								if (vertices.hasOwnProperty(vertexId)) {
									const vertex = vertices[vertexId];
									xCoordinates.push(vertex.x);
									yCoordinates.push(vertex.y);
								}
							}
		
							// Calculate the perimeter and area for the current floor
							const { perimeter, area } = calculatePerimeterAndArea(xCoordinates, yCoordinates);
							const height = floor.height || 'Height not defined';
		
							console.log(`Floor ${index}: Perimeter: ${perimeter}, Area: ${area}, Height: ${height}`);
		
							return { floorIndex: index, perimeter, area, height };
						});
		
						console.log('Floor Metrics:', floorMetrics);
		
						// Optionally update the UI with aggregated or individual floor data
						const totalArea = floorMetrics.reduce((sum, floor) => sum + floor.area, 0);
						const totalPerimeter = floorMetrics.reduce((sum, floor) => sum + floor.perimeter, 0);
						const totalHeight = floorMetrics.reduce((sum, floor) => sum + floor.height, 0);
						// Update the state to display the perimeter and area for each floor
						const floorDetails = floorMetrics
							.map(
								(floor) =>
									`Floor ${floor.floorIndex}: ${Math.round(floor.perimeter)} m perimeter, ${Math.round(floor.area)} m² oppervlak, ${Math.round(floor.height)} m hoogte`
							)
							.join('\n');

						setGeselecteerd_kan(floorDetails);
						// 				a_kan_1floor: number; nfloor_kan: number; l_perim_kan_total: number; 
						// a_bvo_kan: number; 
						// a_facade_kan: number;  
						// a_kan_gevel: number; 
						// c_kan1_z: number;
						setBuildingData_kan({ 
							a_kan_1floor: Math.round(totalArea / floorMetrics.length), nfloor_kan: floorMetrics.length,
							l_perim_kan_total: Math.round(totalPerimeter / floorMetrics.length),
							a_bvo_kan: Math.round(totalArea),
							a_facade_kan: Math.round(totalPerimeter / floorMetrics.length * totalHeight),
							a_kan_gevel: Math.round(totalPerimeter / floorMetrics.length * totalHeight), 
							c_kan1_z: totalHeight,
						});
					} catch (error) {
						console.error(`Error fetching building info:`, error);
					}
				});
			}
		
			return () => {
			  if (button) {
				button.removeEventListener('click', () => {});
			  }
			};
		}, []);





    return (
        <>
            <div class="section" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0', margin: '0' }}>
				

				<h2 style={{marginBottom: '0px' }}>
					Ontwerp downloaden, als input voor configurator
				</h2>
				<h4>Met deze tool kunt u een bestand downloaden met de door je geselecteerde: <br></br><br></br>1. Max. één bedrijfshal, en/of <br></br>2. Max. één buiten kantoor.</h4>
				<h4>Dan kun je het bestand uploaden naar de configurator.</h4>
				<p style={{textAlign: 'left'}}>
					<br></br> 
					1. Max. één hal en max. één kantoor; <br></br> 
					2. Alleen buiten kantoor.
				</p>
				<h3 style={{textAlign: 'left'}}>1. <br></br> Klik op jouw hal in 3D view, en dan bevestig</h3>
				<button id="get_building_info_hal_btn" class="selecteer_btn">
					<b>Bevestig hal selectie</b>
					</button>
				<p class="text_showing_info_of_selected"  >
					{geselecteerd_hal !== null ? geselecteerd_hal : " --"} geselecteerd
				</p>
				<h3 style={{textAlign: 'left'}}>2. <br></br> Klik op jouw kantoor in 3D view, en dan bevestig</h3>
				<button id="get_building_info_kan_btn" class="selecteer_btn">
					<b>Bevestig kantoor selectie</b>
					</button>
				<p class="text_showing_info_of_selected" >
					{geselecteerd_kan !== null ? geselecteerd_kan : " --"} geselecteerd
				</p>
				<h3 style={{textAlign: 'left'}}>3. <br></br> Vul meer informatie in</h3>
				
				
				<div  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0', margin: '0', border: '1px solid' }}>

					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',  }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Aantal docks:
						</label>
						<input
							type="number"
							step="1"
							// value={dockAantalForExport}
							// onChange={(e) => setDockAantalForExport(parseInt((e.target as HTMLInputElement).value))}
							value={dockAantalForExport ?? 0}
							onChange={(e) => {
								const value = (e.target as HTMLInputElement).value;
								// Fallback to 0 if empty or if parseInt is NaN
								const parsedValue = value === '' ? 0 : parseInt(value, 10);
								setDockAantalForExport(isNaN(parsedValue) ? 0 : parsedValue);
							}}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',  }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Hal-kantoor overlap lengte [m]:
						</label>
						<input
							type="number"
							step="1"
							// value={halKanOverlapLength}
							// onChange={(e) => setHalKanOverlapLength(parseInt((e.target as HTMLInputElement).value))}
							value={halKanOverlapLength ?? 0}
							onChange={(e) => {
								const value = (e.target as HTMLInputElement).value;
								// Fallback to 0 if empty or if parseInt is NaN
								const parsedValue = value === '' ? 0 : parseInt(value, 10);
								setHalKanOverlapLength(isNaN(parsedValue) ? 0 : parsedValue);
							}}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',  }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
						Hal totaal compartementering lengte [m]:
						</label>
						<input
							type="number"
							step="1"
							// value={halCompartLength}
							// onChange={(e) => setHalCompartLength(parseInt((e.target as HTMLInputElement).value))}
							value={halCompartLength ?? 0}
							onChange={(e) => {
								const value = (e.target as HTMLInputElement).value;
								// Fallback to 0 if empty or if parseInt is NaN
								const parsedValue = value === '' ? 0 : parseInt(value, 10);
								setHalCompartLength(isNaN(parsedValue) ? 0 : parsedValue);
							}}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',  }}>
						<label style={{ width: '250px', marginRight: '20px' }}>
							Mezzanine oppervlak [m2]:
						</label>
						<input
							type="number"
							step="1"
							value={mezOpp ?? 0}
							onChange={(e) => {
								const value = (e.target as HTMLInputElement).value;
								// Fallback to 0 if empty or if parseInt is NaN
								const parsedValue = value === '' ? 0 : parseInt(value, 10);
								setMezOpp(isNaN(parsedValue) ? 0 : parsedValue);
							}}
							// value={mezOpp}
							// onChange={(e) => setMezOpp(parseInt((e.target as HTMLInputElement).value))}
							style={{ width: '100px', textAlign: 'right', margin: '10px' }}
						/>
					</div>
				</div>
				<br></br>
				<h3 style={{textAlign: 'left'}}>4. <br></br> Download jouw ontwerp</h3>
				<button onClick={handleDownload} class="selecteer_btn">
					Download 
				</button>
				<br></br>
				<h4>Die bestand kun je naar de Configurator uploaden (onder "Ontwerp importeren") en ermee calculeren.</h4>

				


				<br></br>
				<br></br>
            </div>
        </>
    );
}

render(<App/>, document.getElementById('app'));
