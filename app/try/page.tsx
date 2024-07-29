"use client";

export default function Try() {
  let columns = Math.floor(document.body.clientWidth / 50);
  let rows = Math.floor(document.body.clientHeight / 50);
  const parentElement = document.querySelector("#tile-container");
  const createTile = (index) => {
    const tile = document.createElement("div");

    tile.classList.add("tile");

    return tile;
  };

  const createTiles = (quantity) => {
    Array.from(Array(quantity)).map((tile, index) => {
      //@ts-ignore
      parentElement.appendChild(createTile(index));
    });
  };
  createTiles(columns * rows);
  const createGrid = () => {
    if (parentElement) {
      parentElement.innerHTML = "";
    }
    columns = Math.floor(document.body.clientWidth / 50);
    rows = Math.floor(document.body.clientHeight / 50);

    parentElement?.style.setProperty("--columns", columns);
    parentElement?.style.setProperty("--rows", rows);

    createTiles(columns * rows);
  };
  window.onresize = () => createGrid();

  return (
    <>
      <div id="tile-container" className=""></div>
    </>
  );
}
