// GET /api/menu/csv-template
// Returns a downloadable CSV template pre-filled with example rows.

export async function GET() {
  const rows = [
    "name,description,price,category,allergens,spice_level,is_veg,is_vegan,is_gluten_free,prep_time",
    // Example rows covering common dish types
    `Butter Chicken,"Rich and creamy tomato-based curry with tender chicken pieces",18.99,Mains,"Dairy",2,false,false,false,20`,
    `Paneer Tikka,"Marinated cottage cheese grilled in a tandoor oven",14.99,Starters,"Dairy",2,true,false,true,15`,
    `Mango Lassi,"Sweet yoghurt drink blended with fresh mango",5.99,Drinks,"Dairy",0,true,false,true,5`,
    `Garlic Naan,"Soft leavened bread baked in tandoor with garlic butter",3.99,Sides,"Dairy,Gluten,Wheat",0,true,false,false,10`,
    `Dal Makhani,"Black lentils slow-cooked overnight with butter and cream",15.99,Mains,"Dairy",1,true,false,true,25`,
  ];

  const csv = rows.join("\r\n") + "\r\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="servemytable-menu-template.csv"',
    },
  });
}
