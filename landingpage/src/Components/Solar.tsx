import { useEffect, useState } from "preact/hooks";
import css from "./solar.module.scss";

function wToKW(w: number) {
   if (w >= 1000) {
      return `${Math.round(w / 10) / 100} kW`;
   }
   return `${w} W`;
}

function SolarEmpty() {
   return <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"
      viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round"
      stroke-linejoin="round" className={css.solar}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path
         d="M4.28 14h15.44a1 1 0 0 0 .97 -1.243l-1.5 -6a1 1 0 0 0 -.97 -.757h-12.44a1 1 0 0 0 -.97 .757l-1.5 6a1 1 0 0 0 .97 1.243z" />
      <path d="M4 10h16" />
      <path d="M10 6l-1 8" />
      <path d="M14 6l1 8" />
      <path d="M12 14v4" />
      <path d="M7 18h10" />
   </svg>;
}

function SolarFull() {
   return <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"
      viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round"
      stroke-linejoin="round" className={css.solar}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M8 2a4 4 0 1 0 8 0" />
      <path d="M4 3h1" />
      <path d="M19 3h1" />
      <path d="M12 9v1" />
      <path d="M17.2 7.2l.707 .707" />
      <path d="M6.8 7.2l-.7 .7" />
      <path
         d="M4.28 21h15.44a1 1 0 0 0 .97 -1.243l-1.5 -6a1 1 0 0 0 -.97 -.757h-12.44a1 1 0 0 0 -.97 .757l-1.5 6a1 1 0 0 0 .97 1.243z" />
      <path d="M4 17h16" />
      <path d="M10 13l-1 8" />
      <path d="M14 13l1 8" />
   </svg>;
}

interface ISolar {
   a: number;
   b: number;
   c: number;
   solar: number;
}

declare global {
   interface Window {
      solar: ISolar | undefined;
   }
}

export default function Solar({ translation }: Readonly<{ translation: Record<string, string> }>) {

   const [solar, setSolar] = useState<ISolar>();

   useEffect(() => {

      function handleSolar() {
         const power = window.solar;
         setSolar(power);
      }

      if (typeof window.solar === "undefined") {
         document.addEventListener("solar", handleSolar)

         return () => {
            document.removeEventListener("solar", handleSolar);
         }
      } else {
         handleSolar()
      }
   }, []);

   const solarPower = (solar?.solar ?? 0);
   const totalPower = (solar?.a ?? 0) + (solar?.b ?? 0) + (solar?.c ?? 0);
   const gridPower = totalPower - solarPower;

   return <>
      <div className={css.wrapper}>

         {/* SOLAR icon */}
         {solarPower > 0 ? <SolarFull /> : <SolarEmpty />}

         <div className={css.solarLine + " " + css.line + " " + (solarPower > 0 ? css.animate : "")}
            style={{
               "--m": (solarPower / ((totalPower > 0) ? totalPower : 1))
            }}
         >
            <svg width="100%" height="100%" viewBox="0 0 300 2" version="1.1" xmlns="http://www.w3.org/2000/svg"
               style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
               <path d="M0,1 L300,1" />
            </svg>
         </div>

         {/* SERVER icon */}
         <svg xmlns="http://www.w3.org/2000/svg" className={css.server} width="44" height="44"
            viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round"
            stroke-linejoin="round"
            style={{
               "--solarPower": `${totalPower <= 0 ? 50 : Math.round((solarPower / ((totalPower > 0) ? totalPower : 1)) * 100)}%`
            }}>
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M3 4m0 3a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3z" />
            <path d="M15 20h-9a3 3 0 0 1 -3 -3v-2a3 3 0 0 1 3 -3h12" />
            <path d="M7 8v.01" />
            <path d="M7 16v.01" />
            <path d="M20 15l-2 3h3l-2 3" />
         </svg>

         <div className={css.gridLine + " " + css.line + " " + (gridPower > 0 ? css.animate : "")}
            style={{
               "--m": (gridPower / ((totalPower > 0) ? totalPower : 1))
            }}
         >
            <svg width="100%" height="100%" viewBox="0 0 300 5" version="1.1" xmlns="http://www.w3.org/2000/svg"
               style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
               <path d="M0,0 L300,0" />
            </svg>
         </div>

         {/* GRID icon */}
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            className={css.grid}>
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M2 12h4" />
            <path d="M18 12h4" />
            <path d="M18 5v14" />
            <path d="M14 9v6" />
            <path d="M10 5v14" />
            <path d="M6 9v6" />
         </svg>
      </div>

      <div className={css.wrapper}>
         <p>{translation["solar"]}<br /><span>{wToKW(solarPower)}</span></p>
         <p>{translation["server"]}<br /><span>{wToKW(totalPower)}</span></p>
         <p>{translation["grid"]}<br /><span>{wToKW(gridPower)}</span></p>
      </div>
   </>;

}