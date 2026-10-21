const X=require('xlsx');
exports.fixture=()=>{
 const w=X.utils.book_new(),h=['WBS-1','WBS-2','WBS-3','WBS-4','Description','Unit','Qty','Material','Labor','Amount'];
 const values=[
 ['01.01 Slab','Concrete C30 — slab','m³',300,750000,150000,900000],
 ['01.02 Columns','Concrete C30 — columns','m³',100,250000,50000,300000],
 ['01.03 Rebar','Rebar SD40','kg',20000,500000,100000,600000],
 ['01.04 Formwork','Slab formwork','m²',1500,300000,150000,450000],
 ['01.05 Waterstop','Waterstop PVC','m',400,80000,20000,100000],
 ['01.06 Joints','Construction joints','m',250,40000,10000,50000]];
 X.utils.book_append_sheet(w,X.utils.aoa_to_sheet([h,...values.map(r=>['Building A','Structure','Level 01',...r])]),'Structure');
 return X.write(w,{type:'buffer',bookType:'xlsx'});
};
