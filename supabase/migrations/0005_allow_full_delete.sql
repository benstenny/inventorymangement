-- 0005: allow "Delete forever" on items with a sale.
-- 0001 blocked deleting any item with sale history (archive was the only option). The owner now
-- wants a full delete that removes the item, its sale and profit record, and its photos.
-- Archive is still there for hiding an item while keeping its history.

drop trigger if exists items_no_delete_sold on items;
drop function if exists prevent_sold_item_delete();
