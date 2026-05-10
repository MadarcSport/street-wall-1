import React, { useState } from "react";

function ProductCard({ product }) {
  const [mainImage, setMainImage] = useState(product.defaultImage);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="gallery">
      <div
        className="main-image"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={isHovered ? product.hoverImage : mainImage}
          alt={product.title}
        />
      </div>

      <div className="thumbnails">
        {product.thumbnails.map((thumb, index) => (
          <img
            key={index}
            src={thumb.src}
            alt={thumb.alt}
            onClick={() => setMainImage(thumb.src)}
          />
        ))}
      </div>

      <div className="product-info">
        <p className="title">{product.title}</p>
      </div>
    </div>
  );
}

export default ProductCard;

const asset = (file) => `${import.meta.env.BASE_URL}${file}`;

export const citrusMatchaTea = {
  defaultImage: asset("wall3.jpg"),
  hoverImage:
    "https://raw.githubusercontent.com/MadarcSport/pulsius/79342eb31f1fd31d15931c222c596182fd92254d/Can-pulsius-steam-001.gif",
  title: "Citrus & Matcha Tea",
  thumbnails: [
    { src: asset("wall3.jpg"), alt: "Product 1" },
    { src: asset("wall2.jpg"), alt: "Product 1" },
    { src: asset("wall1.jpg"), alt: "Product 1" },
  ],
};
