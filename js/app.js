(function(root){
  'use strict';
  const FN=root.FIELDNOTE,$=id=>document.getElementById(id),geo=FN.geo,exp=FN.exporter;
  const days={'1':'2026-09-13','2':'2026-09-14','3':'2026-09-15','4':'2026-09-16','5':'2026-09-17','6':'2026-09-18','7':'2026-09-19','8':'2026-09-20'};
  const inputs=['code','trip-day','title','place','date','time','author','description','maps-url','lat','lng'];
  const state={image:null,file:null,url:null,loadId:0,previewTimer:0,map:null};
  const val=id=>$(id).value.trim().normalize('NFC');
  function meta(){return {code:val('code'),day:val('trip-day'),title:val('title'),place:val('place'),date:val('date'),time:val('time'),author:val('author'),description:val('description'),lat:val('lat'),lng:val('lng')};}
  function notice(msg='',kind=''){$('status').textContent=msg;$('status').className='status '+kind;}
  function render(){
    const canvas=$('preview-canvas'),empty=$('preview-empty');
    if(!state.image){canvas.style.display='none';empty.hidden=false;$('download-one').disabled=true;return;}
    try{
      const drawn=exp.renderPhoto(state.image,meta(),true);
      canvas.width=drawn.width;canvas.height=drawn.height;
      canvas.getContext('2d').drawImage(drawn,0,0);
      canvas.style.display='block';empty.hidden=true;$('download-one').disabled=false;
    }catch(err){notice('Không xem trước được ảnh: '+err.message,'error');}
  }
  function refresh(){if(state.previewTimer)clearTimeout(state.previewTimer);state.previewTimer=setTimeout(render,115);}
  function resetImage(){state.loadId++;if(state.url)URL.revokeObjectURL(state.url);state.url=null;state.image=null;state.file=null;}
  function checkFile(file){
    if(!file)return false;
    if(!/^(image\/jpeg|image\/png|image\/webp)$/.test(file.type)){
      notice('Chỉ nhận ảnh JPG, PNG hoặc WebP.','error');return false;
    }
    if(file.size>35*1024*1024){notice('Ảnh quá 35 MB. Hãy chọn ảnh khác.','error');return false;}
    return true;
  }
  function loadPhoto(file){
    if(!checkFile(file))return;
    resetImage();const id=state.loadId,url=URL.createObjectURL(file),img=new Image();
    notice('Đang đọc ảnh…');
    img.onload=()=>{
      if(id!==state.loadId){URL.revokeObjectURL(url);return;}
      state.image=img;state.file=file;state.url=url;
      $('file-name').textContent=`${file.name} · ${(file.size/1048576).toFixed(2)} MB · ${img.naturalWidth} × ${img.naturalHeight} px`;
      notice('Đã nhận ảnh. Hãy nhập tên ảnh và địa điểm, sau đó tải PNG.','success');
      refresh();
    };
    img.onerror=()=>{URL.revokeObjectURL(url);notice('Trình duyệt không đọc được ảnh này. Hãy thử JPG hoặc PNG khác.','error');};
    img.src=url;
  }
  function setPoint(lat,lng,center=true){
    const a=Number(lat),b=Number(lng);
    if(!geo.valid(a,b))return false;
    $('lat').value=a.toFixed(6);$('lng').value=b.toFixed(6);
    if(state.map)state.map.setMarker(a,b,center);
    refresh();return true;
  }
  function manualPoint(){
    const a=val('lat'),b=val('lng');
    if(!a&&!b){if(state.map)state.map.clearMarker();refresh();return;}
    if(!a||!b||!geo.valid(Number(a),Number(b))){notice('Tọa độ không hợp lệ. Nhập đủ vĩ độ (−90 đến 90) và kinh độ (−180 đến 180).','error');refresh();return;}
    setPoint(a,b,true);notice('Đã cập nhật tọa độ khảo sát.','success');
  }
  function mapInit(){
    if(state.map)return;
    state.map=new FN.MapPicker({viewport:$('map-viewport'),tiles:$('map-tiles'),pin:$('map-pin'),hint:$('map-loading'),centerLabel:$('map-center'),onPick:(lat,lng)=>{setPoint(lat,lng,false);notice('Đã chọn vị trí trên bản đồ.','success');}});
    const m=meta();if(m.lat!==''&&m.lng!==''&&geo.valid(Number(m.lat),Number(m.lng)))state.map.setMarker(Number(m.lat),Number(m.lng),true);
    $('zoom-in').addEventListener('click',()=>state.map.zoomBy(1));
    $('zoom-out').addEventListener('click',()=>state.map.zoomBy(-1));
    $('zoom-reset').addEventListener('click',()=>state.map.reset());
  }
  function readCoordinates(){
    const raw=val('maps-url'),coords=geo.parse(raw);
    if(!coords){notice('Không đọc được tọa độ. Hãy thử nhập "vĩ độ, kinh độ" hoặc dán liên kết Google Maps đầy đủ (liên kết rút gọn có thể không đọc được).','error');return;}
    setPoint(coords[0],coords[1],true);notice('Đã lấy tọa độ. Bạn có thể kiểm tra ghim trên bản đồ.','success');
  }
  function validate(){
    if(!state.image)return 'Bạn chưa chọn ảnh.';
    if(!val('title'))return 'Bạn chưa nhập tên ảnh.';
    if(!val('place'))return 'Bạn chưa nhập địa điểm chụp.';
    const m=meta();
    if(m.lat!==''||m.lng!==''){
      if(m.lat===''||m.lng===''||!geo.valid(Number(m.lat),Number(m.lng)))return 'Tọa độ chưa hợp lệ. Hãy nhập đủ cả hai ô hoặc xóa tọa độ.';
    }
    return null;
  }
  async function exportPhoto(){
    const err=validate();if(err){notice(err,'error');if(!state.image)$('photo-file').focus();else if(!val('title'))$('title').focus();else if(!val('place'))$('place').focus();else $('location-section').open=true;return;}
    const btn=$('download-one');btn.disabled=true;btn.textContent='Đang tạo ảnh…';
    try{
      const m=meta(),canvas=exp.renderPhoto(state.image,m),blob=await exp.canvasBlob(canvas);
      const name=geo.safeName([m.code,m.title].filter(Boolean).join('-'))||'anh-thuc-dia';
      exp.download(blob,name+'.png');notice('Đã tạo ảnh có chú thích. Bạn có thể tiếp tục chỉnh sửa hoặc chọn ảnh khác.','success');
    }catch(error){notice('Không xuất được ảnh: '+error.message,'error');}
    finally{btn.disabled=!state.image;btn.textContent='↓ Tải ảnh PNG';}
  }
  function resetForm(){
    resetImage();for(const id of inputs)$(id).value='';$('photo-file').value='';$('file-name').textContent='Chưa chọn ảnh';
    if(state.map)state.map.clearMarker();$('location-section').open=false;
    notice();render();$('photo-file').focus();
  }
  function setup(){
    $('photo-file').addEventListener('change',e=>{if(e.target.files&&e.target.files[0])loadPhoto(e.target.files[0]);});
    const drop=$('dropzone');
    for(const type of ['dragenter','dragover'])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.add('dragging');});
    for(const type of ['dragleave','dragend'])drop.addEventListener(type,e=>{e.preventDefault();drop.classList.remove('dragging');});
    drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('dragging');if(e.dataTransfer&&e.dataTransfer.files[0])loadPhoto(e.dataTransfer.files[0]);});
    for(const id of ['code','title','place','date','time','author','description'])$(id).addEventListener('input',refresh);
    $('trip-day').addEventListener('change',()=>{const day=val('trip-day');if(day)$('date').value=days[day];refresh();});
    $('location-section').addEventListener('toggle',()=>{if($('location-section').open)requestAnimationFrame(mapInit);});
    $('read-maps').addEventListener('click',readCoordinates);
    $('maps-url').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();readCoordinates();}});
    for(const id of ['lat','lng'])$(id).addEventListener('change',manualPoint);
    $('open-google').addEventListener('click',()=>root.open(geo.mapsLink(meta()),'_blank','noopener,noreferrer'));
    $('clear-coords').addEventListener('click',()=>{$('lat').value='';$('lng').value='';$('maps-url').value='';if(state.map)state.map.clearMarker();notice('Đã xóa tọa độ.','success');refresh();});
    $('download-one').addEventListener('click',exportPhoto);
    $('reset').addEventListener('click',resetForm);
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})(window);
