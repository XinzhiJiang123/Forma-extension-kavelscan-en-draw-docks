import {render} from 'preact';
import './style.css';
import {Forma} from "forma-embedded-view-sdk/auto";
import {useState, useEffect} from "preact/hooks";
import './assets/styling.css';

const DEFAULT_COLOR = {
    r: 0,
    g: 255,
    b: 255,
    a: 1.0,
};


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
	
		// Calculate "Parkeerplaats benodigd"
		if (halFunctie === "intensief") {
			parkeerplaatsBenodigdCalculation = parkeernormKantoor * oppervlakKantoor + 100;
		} else {
			parkeerplaatsBenodigdCalculation = parkeernormKantoor * oppervlakKantoor + 10;
		}
		setParkeerplaatsBenodigd(parkeerplaatsBenodigdCalculation);
	
		// Calculate "Max. hal oppervlak"
		if (kavelArea !== null) {
			setMaxHalOppervlak(kavelArea - parkeerplaatsBenodigdCalculation * 25);
		}
		}, [parkeernormKantoor, oppervlakKantoor, halFunctie, kavelArea]);

	
		
	const createRandomFloor = async () => {
		// Generate random dimensions and positions for the floor
		const xMin = Math.floor(Math.random() * 40) + 10; // Random x starting point between 10 and 50
		const xDelta = Math.floor(Math.random() * 60) + 20; // Random width between 20 and 80
		const yMin = Math.floor(Math.random() * 50) + 10; // Random y starting point between 10 and 60
		const yDelta = Math.floor(Math.random() * 70) + 20; // Random height between 20 and 90

		const xMax = xMin + xDelta;
		const yMax = yMin + yDelta;

		// Create a floor using Forma API
		try {
			const { urn } = await Forma.elements.floorStack.createFromFloors({
				floors: [
					{
						polygon: [
							[xMin, yMin],
							[xMax, yMin],
							[xMax, yMax],
							[xMin, yMax],
							[xMin, yMin]
						],
						height: 10 // Example height
					}
				]
			});

			const transform = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
			await Forma.proposal.addElement({ urn, transform });

			console.log("Random floor created successfully!");
		} catch (error) {
			console.error("Error creating floor:", error);
		}
	};




    return (
        <>
            <div class="section" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0', margin: '0' }}>
				{/* <h3 style={{backgroundColor: 'rgba(16, 59, 126, 0.9)', width: '100%', color: 'white'}}>
					Selecteer jouw kavel
				</h3> */}

				<button id="get_kavel_info_btn" class="selecteer_btn">
					<b>Selecteer jouw kavel</b>
					</button>
				<p>Kavel oppervlak [m2]: {kavelArea !== null ? kavelArea : "--"}</p>

				<button id="get_bouwvlak_info_btn" class="selecteer_btn">
					<b>Selecteer jouw bouwvlak</b>
					</button>
				<p>Bouwvlak oppervlak [m2]: {bouwvlakArea !== null ? bouwvlakArea : "--"}</p>


				<br></br>
				<h3 style={{backgroundColor: 'rgba(16, 59, 126, 0.9)', width: '100%', color: 'white'}}>
					Vul kavel eigenschappen in
				</h3>

				<div  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0', margin: '0', border: '1px solid' }}>
					
					<p style={{backgroundColor: 'rgba(16, 59, 126, 0.6)', width: '100%', color: 'white'}}><b>Kavel gegevens</b></p>
					
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

					<p style={{backgroundColor: 'rgba(16, 59, 126, 0.6)', width: '100%', color: 'white'}}><b>Kantoor gegevens</b></p>

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
				<h3 style={{backgroundColor: 'rgba(16, 59, 126, 0.9)', width: '100%', color: 'white'}}>
					Resultaat: <br></br> geoptimaliseerd kavelgebruik
				</h3>

				<div>
					<p>Parkeerplaats benodigd: {parkeerplaatsBenodigd}</p>
					<p><b>Max. hal oppervlak [m2]: {maxHalOppervlak !== null ? maxHalOppervlak : "--"}</b></p>
				</div>

				<br></br>
				<br></br>

				<button onClick={createRandomFloor}>Create rectangular docks</button>

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
