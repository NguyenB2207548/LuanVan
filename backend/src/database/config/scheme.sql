create database luanvan;
use luanvan;
show tables;

select * from users;
select * from seller_profiles;
select * from users;
select * from approval_requests;
select * from categories;
select * from products;
select * from variants;
select * from attributes;
select * from attribute_values;
select * from images;
select * from designs;
select * from mockups;
select * from print_areas;
select * from artworks;
select * from carts;
select * from cart_items;
select * from orders;
select * from order_items;
select * from product_categories;

SELECT * FROM mockups WHERE product_id = 46;

-- delete from products where id in (57);
delete from variants where id in (49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72);
-- delete from categories where id in (1);
-- delete from mockups where id in (8);
-- delete from print_areas where id in (8);
-- delete from approval_requests where id in (1,2,3,4,5,6,7,8);
-- DELETE FROM images
-- WHERE id BETWEEN 181 AND 206;

SHOW CREATE TABLE products_categories;
SHOW CREATE TABLE product_attributes;
SHOW CREATE TABLE variants;
SHOW CREATE TABLE images;